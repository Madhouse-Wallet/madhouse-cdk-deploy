import ec2 = require('aws-cdk-lib/aws-ec2');
import ecs = require('aws-cdk-lib/aws-ecs');
import iam = require('aws-cdk-lib/aws-iam');
import ecr = require('aws-cdk-lib/aws-ecr');
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import ecs_patterns = require('aws-cdk-lib/aws-ecs-patterns');
import cdk = require('aws-cdk-lib');
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';

class MadhouseFargate extends cdk.Stack {
  constructor(scope: cdk.App, 
    id: string ,
    cert: string, 
    _domainName: string,
    props?: cdk.StackProps
    ) {
    super(scope, id, props);
    
    // Create VPC and Fargate Cluster
const _vpc = new ec2.Vpc(this, 'Vpc', {
        subnetConfiguration: [
          { cidrMask: 23, name: 'Public', subnetType: ec2.SubnetType.PUBLIC }
        ]
      });

const _taskSubnets = { subnets: _vpc.publicSubnets }

const _repository =  ecr.Repository.fromRepositoryName(this, 'Repository', 
        'cdk-hnb659fds-container-assets-145023121234-us-east-1',
      );

const _ecsRole= iam.Role.fromRoleArn(this, 'ecsRole',
        'arn:aws:iam::145023121234:role/madhouse-ecs-role',{
          mutable: true,
        });
      _repository.grantPull(_ecsRole);

const _branch = process.env.DEV_BRANCH || 'main';
const _commit = process.env.COMMIT || '';
const _NEXT_PUBLIC_AWS_S3_ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY || '';
const _NEXT_PUBLIC_AWS_S3_REGION = process.env.NEXT_PUBLIC_AWS_S3_REGION || '';
const _NEXT_PUBLIC_AWS_S3_SECRET_KEY = process.env.NEXT_PUBLIC_AWS_S3_SECRET_KEY || '';
const _NEXT_PUBLIC_EMAIL = process.env.NEXT_PUBLIC_EMAIL || '';

 const _taskImageOptions = {
    image: ecs.ContainerImage.fromDockerImageAsset(
      new DockerImageAsset(this, `madhouse-image${id}`, {
      buildArgs:{
        BRANCH: _branch,
        COMMIT: _commit,
        NEXT_PUBLIC_AWS_S3_ACCESS_KEY: _NEXT_PUBLIC_AWS_S3_ACCESS_KEY,
        NEXT_PUBLIC_AWS_S3_REGION: _NEXT_PUBLIC_AWS_S3_REGION,
        NEXT_PUBLIC_AWS_S3_SECRET_KEY: _NEXT_PUBLIC_AWS_S3_SECRET_KEY,
        NEXT_PUBLIC_EMAIL: _NEXT_PUBLIC_EMAIL
      },
      directory: './docker',
      assetName: 'madhouse-image',
      file: 'Dockerfile',
      cacheDisabled: true,
      extraHash: String(Math.floor(Math.random() * (10000 - 1)) + 1)
    })),
    taskRole:  _ecsRole,
    executionRole:  _ecsRole, 
  }

  // const __taskImageOptions = {
  //       image: ecs.ContainerImage.fromRegistry('145023121234.dkr.ecr.us-east-1.amazonaws.com/cdk-hnb659fds-container-assets-145023121234-us-east-1:5ed1439fa4254f97b59d3ce87c695dc2477f7cc026ffc808aa951a90fe7c3102'),
  //       containerPort: 80,
  //       taskRole:  ecsRole,
  //       executionRole:  ecsRole, 
  //     }

const _domainZone = cdk.aws_route53.HostedZone.fromLookup(this,
      'madhouse-hostedzone',{domainName: 'madhousewallet.com',
      }
    )

const _cert = Certificate.fromCertificateArn(this,
     `madhouse-cert${id}`,cert )

const _serviceProps = {
        vpc: _vpc,

        memoryLimitMiB: 4096,
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
const _service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, `fargate-service${id}`,_serviceProps );

// CloudFront distribution
const _distribution = 
new cloudfront.Distribution(this, `SiteDistribution${id}`, {
    certificate: _cert,
    domainNames: [_domainName],  
    defaultBehavior: {
        origin:  new cloudfront_origins.LoadBalancerV2Origin(_service.loadBalancer),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, // Redirect HTTP to HTTPS for the viewer.
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // Cache everything if you don't need caching
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER, // You can adjust this if needed
      }
      })

//Create A Record Routing
new cdk.aws_route53.ARecord(this, `cloudfrontDNS${id}`, {
      zone: _domainZone,
      recordName: _domainName, 
      target: cdk.aws_route53.RecordTarget.fromAlias(new cdk.aws_route53_targets.CloudFrontTarget(_distribution))
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

