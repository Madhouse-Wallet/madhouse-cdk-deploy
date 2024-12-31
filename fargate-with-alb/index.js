"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ec2 = require("aws-cdk-lib/aws-ec2");
const ecs = require("aws-cdk-lib/aws-ecs");
const iam = require("aws-cdk-lib/aws-iam");
const ecr = require("aws-cdk-lib/aws-ecr");
const aws_ecr_assets_1 = require("aws-cdk-lib/aws-ecr-assets");
const ecs_patterns = require("aws-cdk-lib/aws-ecs-patterns");
const cdk = require("aws-cdk-lib");
class MadhouseFargate extends cdk.Stack {
    constructor(scope, id, branch, cert, _domainName, props, _name) {
        super(scope, id, props);
        const name = _name || '';
        // Create VPC and Fargate Cluster
        // NOTE: Limit AZs to avoid reaching resource quotas
        const vpc = ec2.Vpc.fromVpcAttributes(this, 'madhouse-vpc', {
            vpcId: 'vpc-0b4426b6b2c81b117',
            availabilityZones: ['us-east-1a', 'us-east-1b'],
            // Either pass literals for all IDs
            publicSubnetIds: ['subnet-0d6ef10031ae3e8c0', 'subnet-0d492e0e7f00f983e'],
            privateSubnetIds: ['subnet-04c5eb95569d6fc19', 'subnet-0fb3947b66d250027']
        });
        const cluster = ecs.Cluster.fromClusterAttributes(this, 'cluster', {
            clusterArn: 'arn:aws:ecs:us-east-1:145023121234:cluster/madhouse-cluster',
            clusterName: "madhouse-cluster", vpc: vpc,
            securityGroups: [
                ec2.SecurityGroup.fromSecurityGroupId(this, 'madhouse-ecs-sg-cluster', 'sg-01cd17c4e6b52b54f', {
                    mutable: true
                }),
            ]
        });
        const repository = ecr.Repository.fromRepositoryName(this, 'Repository', 'cdk-hnb659fds-container-assets-145023121234-us-east-1');
        const ecsRole = iam.Role.fromRoleArn(this, 'ecsRole', 'arn:aws:iam::145023121234:role/madhouse-ecs-role', {
            mutable: true,
        });
        repository.grantPull(ecsRole);
        // Instantiate Fargate Service with just cluster and image
        new ecs_patterns.ApplicationLoadBalancedFargateService(this, `fargate-service${name}`, {
            cluster,
            memoryLimitMiB: 8192,
            desiredCount: 1,
            cpu: 2048,
            ephemeralStorageGiB: 30,
            assignPublicIp: true,
            listenerPort: 443,
            redirectHTTP: true,
            certificate: cdk.aws_certificatemanager.Certificate.fromCertificateArn(this, 'madhouse-cert', cert),
            domainName: _domainName,
            domainZone: cdk.aws_route53.HostedZone.fromLookup(this, 'madhouse-hostedzone', { domainName: 'madhousewallet.com',
            }),
            protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTPS,
            securityGroups: [
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
                image: ecs.ContainerImage.fromDockerImageAsset(new aws_ecr_assets_1.DockerImageAsset(this, `madhouse-image${name}`, {
                    buildArgs: {
                        BRANCH: branch
                    },
                    directory: './docker',
                    assetName: 'madhouse-image',
                    file: 'Dockerfile'
                })),
                taskRole: ecsRole,
                executionRole: ecsRole,
            },
        });
    }
}
const app = new cdk.App();
new MadhouseFargate(app, 'madhouse', 'main', 'arn:aws:acm:us-east-1:145023121234:certificate/c934442e-84ed-4682-8a9d-eed1886a3ea4', 'app.madhousewallet.com', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});
new MadhouseFargate(app, 'uat', 'staging', 'arn:aws:acm:us-east-1:145023121234:certificate/5ca28edf-5484-4485-8b0a-ee84f1e61a80', 'staging.madhousewallet.com', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
}, 'staging');
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUE0QztBQUM1QywyQ0FBNEM7QUFDNUMsMkNBQTRDO0FBQzVDLDJDQUE0QztBQUM1QywrREFBOEQ7QUFDOUQsNkRBQThEO0FBQzlELG1DQUFvQztBQUVwQyxNQUFNLGVBQWdCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDckMsWUFBWSxLQUFjLEVBQUUsRUFBVSxFQUFFLE1BQWMsRUFDcEQsSUFBWSxFQUFFLFdBQW1CLEVBQ2pDLEtBQXNCLEVBQUUsS0FBYztRQUN0QyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLElBQUksR0FBRyxLQUFLLElBQUksRUFBRSxDQUFDO1FBRXpCLGlDQUFpQztRQUNqQyxvREFBb0Q7UUFDcEQsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQzFELEtBQUssRUFBRSx1QkFBdUI7WUFDOUIsaUJBQWlCLEVBQUUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDO1lBRS9DLG1DQUFtQztZQUNuQyxlQUFlLEVBQUUsQ0FBQywwQkFBMEIsRUFBRSwwQkFBMEIsQ0FBQztZQUN6RSxnQkFBZ0IsRUFBQyxDQUFDLDBCQUEwQixFQUFDLDBCQUEwQixDQUFDO1NBRXpFLENBQUMsQ0FBQztRQUVILE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRztZQUNsRSxVQUFVLEVBQUUsNkRBQTZEO1lBQ3pFLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxHQUFHLEVBQUUsR0FBRztZQUN6QyxjQUFjLEVBQUU7Z0JBQ2QsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUseUJBQXlCLEVBQUUsc0JBQXNC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Q0FBQztBQUVULElBQUksZUFBZSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUMsU0FBUyxFQUN0QyxxRkFBcUYsRUFDckYsNEJBQTRCLEVBQzVCO0lBQ0EsR0FBRyxFQUFFO1FBQ0gsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO1FBQ3hDLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQjtLQUNuQztDQUFDLEVBRUYsU0FBUyxDQUFDLENBQUM7QUFHakIsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGVjMiA9IHJlcXVpcmUoJ2F3cy1jZGstbGliL2F3cy1lYzInKTtcclxuaW1wb3J0IGVjcyA9IHJlcXVpcmUoJ2F3cy1jZGstbGliL2F3cy1lY3MnKTtcclxuaW1wb3J0IGlhbSA9IHJlcXVpcmUoJ2F3cy1jZGstbGliL2F3cy1pYW0nKTtcclxuaW1wb3J0IGVjciA9IHJlcXVpcmUoJ2F3cy1jZGstbGliL2F3cy1lY3InKTtcclxuaW1wb3J0IHsgRG9ja2VySW1hZ2VBc3NldCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3ItYXNzZXRzJztcclxuaW1wb3J0IGVjc19wYXR0ZXJucyA9IHJlcXVpcmUoJ2F3cy1jZGstbGliL2F3cy1lY3MtcGF0dGVybnMnKTtcclxuaW1wb3J0IGNkayA9IHJlcXVpcmUoJ2F3cy1jZGstbGliJyk7XHJcblxyXG5jbGFzcyBNYWRob3VzZUZhcmdhdGUgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQXBwLCBpZDogc3RyaW5nICxicmFuY2g6IHN0cmluZyxcclxuICAgIGNlcnQ6IHN0cmluZywgX2RvbWFpbk5hbWU6IHN0cmluZyxcclxuICAgIHByb3BzPzogY2RrLlN0YWNrUHJvcHMsIF9uYW1lPzogc3RyaW5nKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuICAgIFxyXG4gICAgY29uc3QgbmFtZSA9IF9uYW1lIHx8ICcnO1xyXG5cclxuICAgIC8vIENyZWF0ZSBWUEMgYW5kIEZhcmdhdGUgQ2x1c3RlclxyXG4gICAgLy8gTk9URTogTGltaXQgQVpzIHRvIGF2b2lkIHJlYWNoaW5nIHJlc291cmNlIHF1b3Rhc1xyXG4gICAgY29uc3QgdnBjID0gZWMyLlZwYy5mcm9tVnBjQXR0cmlidXRlcyh0aGlzLCAnbWFkaG91c2UtdnBjJywge1xyXG4gICAgICB2cGNJZDogJ3ZwYy0wYjQ0MjZiNmIyYzgxYjExNycsXHJcbiAgICAgIGF2YWlsYWJpbGl0eVpvbmVzOiBbJ3VzLWVhc3QtMWEnLCAndXMtZWFzdC0xYiddLFxyXG4gICAgXHJcbiAgICAgIC8vIEVpdGhlciBwYXNzIGxpdGVyYWxzIGZvciBhbGwgSURzXHJcbiAgICAgIHB1YmxpY1N1Ym5ldElkczogWydzdWJuZXQtMGQ2ZWYxMDAzMWFlM2U4YzAnLCAnc3VibmV0LTBkNDkyZTBlN2YwMGY5ODNlJ10sXHJcbiAgICAgIHByaXZhdGVTdWJuZXRJZHM6WydzdWJuZXQtMDRjNWViOTU1NjlkNmZjMTknLCdzdWJuZXQtMGZiMzk0N2I2NmQyNTAwMjcnXVxyXG4gICAgXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgY29uc3QgY2x1c3RlciA9IGVjcy5DbHVzdGVyLmZyb21DbHVzdGVyQXR0cmlidXRlcyh0aGlzLCAnY2x1c3RlcicsICB7XHJcbiAgICAgIGNsdXN0ZXJBcm46ICdhcm46YXdzOmVjczp1cy1lYXN0LTE6MTQ1MDIzMTIxMjM0OmNsdXN0ZXIvbWFkaG91c2UtY2x1c3RlcicsXHJcbiAgICAgIGNsdXN0ZXJOYW1lOiBcIm1hZGhvdXNlLWNsdXN0ZXJcIiwgdnBjOiB2cGMsXHJcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbXHJcbiAgICAgICAgZWMyLlNlY3VyaXR5R3JvdXAuZnJvbVNlY3VyaXR5R3JvdXBJZCh0aGlzLCAnbWFkaG91c2UtZWNzLXNnLWNsdXN0ZXInLCAnc2ctMDFjZDE3YzRlNmI1MmI1NGYnLCB7XHJcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlXHJcbiAgICAgICAgfSksXHJcbiAgICAgIF1cclxuXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHJlcG9zaXRvcnkgPSAgZWNyLlJlcG9zaXRvcnkuZnJvbVJlcG9zaXRvcnlOYW1lKHRoaXMsICdSZXBvc2l0b3J5JywgXHJcbiAgICAnY2RrLWhuYjY1OWZkcy1jb250YWluZXItYXNzZXRzLTE0NTAyMzEyMTIzNC11cy1lYXN0LTEnLFxyXG4gICk7XHJcblxyXG4gIGNvbnN0IGVjc1JvbGU9IGlhbS5Sb2xlLmZyb21Sb2xlQXJuKHRoaXMsICdlY3NSb2xlJyxcclxuICAgICdhcm46YXdzOmlhbTo6MTQ1MDIzMTIxMjM0OnJvbGUvbWFkaG91c2UtZWNzLXJvbGUnLHtcclxuICAgICAgbXV0YWJsZTogdHJ1ZSxcclxuICAgIH0pO1xyXG5cclxuICByZXBvc2l0b3J5LmdyYW50UHVsbChlY3NSb2xlKTtcclxuXHJcbiAgICAvLyBJbnN0YW50aWF0ZSBGYXJnYXRlIFNlcnZpY2Ugd2l0aCBqdXN0IGNsdXN0ZXIgYW5kIGltYWdlXHJcbiAgICBuZXcgZWNzX3BhdHRlcm5zLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VkRmFyZ2F0ZVNlcnZpY2UodGhpcywgYGZhcmdhdGUtc2VydmljZSR7bmFtZX1gLCB7XHJcbiAgICAgIGNsdXN0ZXIsXHJcbiAgICAgIFxyXG4gICAgICAgIG1lbW9yeUxpbWl0TWlCOiA4MTkyLFxyXG4gICAgICAgIGRlc2lyZWRDb3VudDogMSxcclxuICAgICAgICBjcHU6IDIwNDgsXHJcbiAgICAgICAgZXBoZW1lcmFsU3RvcmFnZUdpQjogMzAsXHJcbiAgICAgICAgXHJcbiAgICAgIGFzc2lnblB1YmxpY0lwOiB0cnVlLFxyXG4gICAgICBsaXN0ZW5lclBvcnQ6IDQ0MyxcclxuICAgICAgcmVkaXJlY3RIVFRQOiB0cnVlLFxyXG4gICAgICBjZXJ0aWZpY2F0ZTpjZGsuYXdzX2NlcnRpZmljYXRlbWFuYWdlci5DZXJ0aWZpY2F0ZS5mcm9tQ2VydGlmaWNhdGVBcm4odGhpcyxcclxuICAgICAgICAnbWFkaG91c2UtY2VydCcsY2VydCApLFxyXG4gICAgICBkb21haW5OYW1lOiBfZG9tYWluTmFtZSxcclxuICAgICAgZG9tYWluWm9uZTogY2RrLmF3c19yb3V0ZTUzLkhvc3RlZFpvbmUuZnJvbUxvb2t1cCh0aGlzLFxyXG4gICAgICAgICdtYWRob3VzZS1ob3N0ZWR6b25lJyx7ZG9tYWluTmFtZTogJ21hZGhvdXNld2FsbGV0LmNvbScsXHJcbiAgICAgICAgICBcclxuICAgICAgICAgfVxyXG4gICAgICApLFxyXG4gICAgICBwcm90b2NvbDpjZGsuYXdzX2VsYXN0aWNsb2FkYmFsYW5jaW5ndjIuQXBwbGljYXRpb25Qcm90b2NvbC5IVFRQUyxcclxuICAgICAgc2VjdXJpdHlHcm91cHM6WyAgICAgICAgXHJcbiAgICAgICAgZWMyLlNlY3VyaXR5R3JvdXAuZnJvbVNlY3VyaXR5R3JvdXBJZCh0aGlzLCAnbWFkaG91c2UtZWNzLXNnJywgJ3NnLTAxY2QxN2M0ZTZiNTJiNTRmJywge1xyXG4gICAgICAgIG11dGFibGU6IHRydWVcclxuICAgICAgfSksXHJcbiAgICAgIGVjMi5TZWN1cml0eUdyb3VwLmZyb21TZWN1cml0eUdyb3VwSWQodGhpcywgJ21hZGhvdXNlLWFsYi1zZycsICdzZy0wNGVhZmE0YTE4OGY2YTgzNycsIHtcclxuICAgICAgICBtdXRhYmxlOiB0cnVlXHJcbiAgICAgIH0pLFxyXG4gICAgXSxcclxuICAgICAgdGFza1N1Ym5ldHM6IHtcclxuICAgICAgICBzdWJuZXRzOiBbXHJcbiAgICAgICAgICBlYzIuU3VibmV0LmZyb21TdWJuZXRJZCh0aGlzLCAncHViLXN1Ym5ldC0xJywgJ3N1Ym5ldC0wZDZlZjEwMDMxYWUzZThjMCcpLFxyXG4gICAgICAgICAgZWMyLlN1Ym5ldC5mcm9tU3VibmV0SWQodGhpcywgJ3B1Yi1zdWJuZXQtMicsICdzdWJuZXQtMGQ0OTJlMGU3ZjAwZjk4M2UnKSxcclxuICAgICAgICBdXHJcbiAgICAgIH0sXHJcbiAgICAgIHRhc2tJbWFnZU9wdGlvbnM6IHtcclxuICAgICAgICBpbWFnZTogZWNzLkNvbnRhaW5lckltYWdlLmZyb21Eb2NrZXJJbWFnZUFzc2V0KFxyXG4gICAgICAgICAgbmV3IERvY2tlckltYWdlQXNzZXQodGhpcywgYG1hZGhvdXNlLWltYWdlJHtuYW1lfWAsIHtcclxuICAgICAgICAgIGJ1aWxkQXJnczp7XHJcbiAgICAgICAgICAgIEJSQU5DSDogYnJhbmNoXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZGlyZWN0b3J5OiAnLi9kb2NrZXInLFxyXG4gICAgICAgICAgYXNzZXROYW1lOiAnbWFkaG91c2UtaW1hZ2UnLFxyXG4gICAgICAgICAgZmlsZTogJ0RvY2tlcmZpbGUnXHJcbiAgICAgICAgfSkpLFxyXG4gICAgICAgIHRhc2tSb2xlOiAgZWNzUm9sZSxcclxuICAgICAgICBleGVjdXRpb25Sb2xlOiAgZWNzUm9sZSwgXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcblxyXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xyXG5cclxubmV3IE1hZGhvdXNlRmFyZ2F0ZShhcHAsICdtYWRob3VzZScsJ21haW4nLFxyXG4gICdhcm46YXdzOmFjbTp1cy1lYXN0LTE6MTQ1MDIzMTIxMjM0OmNlcnRpZmljYXRlL2M5MzQ0NDJlLTg0ZWQtNDY4Mi04YTlkLWVlZDE4ODZhM2VhNCcsXHJcbiAgJ2FwcC5tYWRob3VzZXdhbGxldC5jb20nXHJcbiAgLHtcclxuICBlbnY6IHtcclxuICAgIGFjY291bnQ6IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQsXHJcbiAgICByZWdpb246IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTlxyXG4gICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxubmV3IE1hZGhvdXNlRmFyZ2F0ZShhcHAsICd1YXQnLCdzdGFnaW5nJyxcclxuICAnYXJuOmF3czphY206dXMtZWFzdC0xOjE0NTAyMzEyMTIzNDpjZXJ0aWZpY2F0ZS81Y2EyOGVkZi01NDg0LTQ0ODUtOGIwYS1lZTg0ZjFlNjFhODAnLFxyXG4gICdzdGFnaW5nLm1hZGhvdXNld2FsbGV0LmNvbScsXHJcbiAge1xyXG4gIGVudjoge1xyXG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcclxuICAgIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OXHJcbiAgICAgIH19LFxyXG4gICAgICBcclxuICAgICAgJ3N0YWdpbmcnKTtcclxuXHJcblxyXG5hcHAuc3ludGgoKTtcclxuXHJcbiJdfQ==