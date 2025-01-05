import ec2 = require('aws-cdk-lib/aws-ec2');
import ecs = require('aws-cdk-lib/aws-ecs');
import iam = require('aws-cdk-lib/aws-iam');
import ecr = require('aws-cdk-lib/aws-ecr');
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import ecs_patterns = require('aws-cdk-lib/aws-ecs-patterns');
import cdk = require('aws-cdk-lib');
import globalaccelerator = require('aws-cdk-lib/aws-globalaccelerator');
import ga_endpoints = require('aws-cdk-lib/aws-globalaccelerator-endpoints');
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Duration } from 'aws-cdk-lib';

class MadhouseFargate extends cdk.Stack {
  constructor(scope: cdk.App, 
    id: string ,
    cert: string, 
    _domainName: string,
    props?: cdk.StackProps
    ) {
    super(scope, id, props);
    
    // Create VPC and Fargate Cluster
const vpc = new ec2.Vpc(this, 'Vpc', { natGateways: 1 });

const _taskSubnets = { subnets:vpc.publicSubnets }

const repository =  ecr.Repository.fromRepositoryName(this, 'Repository', 
        'cdk-hnb659fds-container-assets-145023121234-us-east-1',
      );

const ecsRole= iam.Role.fromRoleArn(this, 'ecsRole',
        'arn:aws:iam::145023121234:role/madhouse-ecs-role',{
          mutable: true,
        });
      repository.grantPull(ecsRole);

const branch = process.env.DEV_BRANCH || 'main';
const commit = process.env.COMMIT || '';
 const _taskImageOptions = {
    image: ecs.ContainerImage.fromDockerImageAsset(
      new DockerImageAsset(this, `madhouse-image${id}`, {
      buildArgs:{
        BRANCH: branch,
        COMMIT: commit
      },
      directory: './docker',
      assetName: 'madhouse-image',
      file: 'Dockerfile',
      cacheDisabled: true,
      extraHash: String(Math.floor(Math.random() * (10000 - 1)) + 1)
    })),
    taskRole:  ecsRole,
    executionRole:  ecsRole, 
  }

  // const __taskImageOptions = {
  //       image: ecs.ContainerImage.fromRegistry('145023121234.dkr.ecr.us-east-1.amazonaws.com/cdk-hnb659fds-container-assets-145023121234-us-east-1:5ed1439fa4254f97b59d3ce87c695dc2477f7cc026ffc808aa951a90fe7c3102'),
  //       containerPort: 80,
  //       taskRole:  ecsRole,
  //       executionRole:  ecsRole, 
  //     }

  // Create an Accelerator
const _accelerator = new globalaccelerator.Accelerator(this, `Accelerator${id}`,{
      enabled: true
    });

const _domainZone = cdk.aws_route53.HostedZone.fromLookup(this,
      'madhouse-hostedzone',{domainName: 'madhousewallet.com',
      }
    )

const _cert = Certificate.fromCertificateArn(this,
     `madhouse-cert${id}`,cert )

const serviceProps = {
        vpc: vpc,

        memoryLimitMiB: 2048,
        desiredCount: 1,
        cpu: 1024,
        ephemeralStorageGiB: 21,
          
        certificate:_cert,
        domainName: _domainName,
        domainZone: _domainZone,
        recordType: cdk.aws_ecs_patterns.ApplicationLoadBalancedServiceRecordType.NONE,
        protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTPS,
        redirectHTTP: true,

        assignPublicIp: true,
        taskSubnets: _taskSubnets,
        taskImageOptions: _taskImageOptions,
      }

      //Create Service
      const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, `fargate-service${id}`,serviceProps );
      service.service.connections.allowFrom(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
      service.service.connections.allowFrom(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));
      
      // Create a Listener
      const _listener = _accelerator.addListener(`Listener${id}`, {
        portRanges: [
              {
                fromPort: 443,
              },
              {
                fromPort: 80,
              },
        ],});

      _listener.addEndpointGroup(`Group${id}`, {
      endpoints: [new ga_endpoints.ApplicationLoadBalancerEndpoint(service.loadBalancer)],
      });

        // CloudFront distribution
  const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
        certificate: _cert,
        domainNames: [_domainName],
        errorResponses:[
          {
            httpStatus: 403,
            responseHttpStatus: 403,
            responsePagePath: '/error.html',
            ttl: Duration.minutes(30),
          }
        ],
        defaultBehavior: {
          origin:  new cloudfront_origins.LoadBalancerV2Origin(service.loadBalancer),
          compress: true,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        }
        })

        //Latency based A Record Routing
        new cdk.aws_route53.ARecord(this, `cloudfrontDNS${id}`, {
          zone: _domainZone,
          recordName: _domainName, 
          target: cdk.aws_route53.RecordTarget.fromAlias(new cdk.aws_route53_targets.CloudFrontTarget(distribution)),
          region: 'ap-south-1'
        });


      new cdk.aws_route53.ARecord(this, `albDNS${id}`, {
        zone: _domainZone,
        recordName: _domainName, 
        target: cdk.aws_route53.RecordTarget.fromAlias(new cdk.aws_route53_targets.LoadBalancerTarget(service.loadBalancer)),
        region: 'us-east-1'
      });

      new cdk.aws_route53.ARecord(this, `gaDNS${id}`, {
        zone: _domainZone,
        recordName: _domainName, 
        target: cdk.aws_route53.RecordTarget.fromAlias(new cdk.aws_route53_targets.GlobalAcceleratorTarget(_accelerator)),
        region: 'af-south-1'
      });
    }
  }

const app = new cdk.App();

new MadhouseFargate(app,
  'madhouse',
  'arn:aws:acm:us-east-1:145023121234:certificate/c934442e-84ed-4682-8a9d-eed1886a3ea4',
  'app.madhousewallet.com',
  {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
      }
      });

new MadhouseFargate(app,
  'uat',
  'arn:aws:acm:us-east-1:145023121234:certificate/5ca28edf-5484-4485-8b0a-ee84f1e61a80',
  'staging.madhousewallet.com',
  {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
      }});

new MadhouseFargate(app, 
  'dev',
  'arn:aws:acm:us-east-1:145023121234:certificate/657e4e34-1c24-4bb7-98fa-cb26513ef475',
  'devstack.madhousewallet.com',
  {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
      }});

new MadhouseFargate(app, 
  'dev2alb',
  'arn:aws:acm:us-east-1:145023121234:certificate/4a8d1a05-9508-4554-b47d-70e173dbdacd',
  'gatest.madhousewallet.com',
  {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
      }});

app.synth();

