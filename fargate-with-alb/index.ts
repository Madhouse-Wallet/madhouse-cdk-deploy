import ec2 = require('aws-cdk-lib/aws-ec2');
import ecs = require('aws-cdk-lib/aws-ecs');
import iam = require('aws-cdk-lib/aws-iam');
import ecr = require('aws-cdk-lib/aws-ecr');
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import ecs_patterns = require('aws-cdk-lib/aws-ecs-patterns');
import cdk = require('aws-cdk-lib');

class MadhouseFargate extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC and Fargate Cluster
    // NOTE: Limit AZs to avoid reaching resource quotas
    const vpc = ec2.Vpc.fromVpcAttributes(this, 'madhouse-vpc', {
      vpcId: 'vpc-0b4426b6b2c81b117',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
    
      // Either pass literals for all IDs
      publicSubnetIds: ['subnet-0d6ef10031ae3e8c0', 'subnet-0d492e0e7f00f983e'],
      privateSubnetIds:['subnet-04c5eb95569d6fc19','subnet-0fb3947b66d250027']
    
    });
    
    const cluster = ecs.Cluster.fromClusterAttributes(this, 'cluster',  {
      clusterArn: 'arn:aws:ecs:us-east-1:145023121234:cluster/madhouse-cluster',
      clusterName: "madhouse-cluster", vpc: vpc,
      securityGroups: [
        ec2.SecurityGroup.fromSecurityGroupId(this, 'madhouse-ecs-sg-cluster', 'sg-01cd17c4e6b52b54f', {
          mutable: true
        }),
      ]

  });

  const repository =  ecr.Repository.fromRepositoryName(this, 'Repository', 
    'cdk-hnb659fds-container-assets-145023121234-us-east-1',
  );

  const ecsRole= iam.Role.fromRoleArn(this, 'ecsRole',
    'arn:aws:iam::145023121234:role/madhouse-ecs-role',{
      mutable: true,
    });

  repository.grantPull(ecsRole);

    // Instantiate Fargate Service with just cluster and image
    new ecs_patterns.ApplicationLoadBalancedFargateService(this, "fargate-service", {
      cluster,
      /*
        memoryLimitMiB: 2048,
        desiredCount: 1,
        cpu: 2048,
        ephemeralStorageGiB: 5,
        */
      assignPublicIp: true,
      listenerPort: 443,
      redirectHTTP: true,
      certificate:cdk.aws_certificatemanager.Certificate.fromCertificateArn(this,
        'madhouse-cert','arn:aws:acm:us-east-1:145023121234:certificate/c934442e-84ed-4682-8a9d-eed1886a3ea4' ),
      domainName: 'app.madhousewallet.com',
      domainZone: cdk.aws_route53.HostedZone.fromLookup(this,
        'madhouse-hostedzone',{domainName: 'madhousewallet.com',
          
         }
      ),
      protocol:cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTPS,
      securityGroups:[        
        ec2.SecurityGroup.fromSecurityGroupId(this, 'madhouse-ecs-sg', 'sg-01cd17c4e6b52b54f', {
        mutable: true
      }),
      ec2.SecurityGroup.fromSecurityGroupId(this, 'madhouse-alb-sg', 'sg-04eafa4a188f6a837', {
        mutable: true
      }),
    ],
      taskSubnets: {
        subnets: [
          ec2.Subnet.fromSubnetId(this, 'pub-subnet-1', 'subnet-0d6ef10031ae3e8c0'),
          ec2.Subnet.fromSubnetId(this, 'pub-subnet-2', 'subnet-0d492e0e7f00f983e'),
        ]
      },
      taskImageOptions: {
        image: ecs.ContainerImage.fromDockerImageAsset(
          new DockerImageAsset(this, 'madhouse-image', {
          directory: './docker',
          assetName: 'madhouse-image',
          file: 'Dockerfile'
        })),
        taskRole:  ecsRole,
        executionRole:  ecsRole, 
      },
    });
  }
}


const app = new cdk.App();

new MadhouseFargate(app, 'madhouse',{
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
}});

app.synth();
