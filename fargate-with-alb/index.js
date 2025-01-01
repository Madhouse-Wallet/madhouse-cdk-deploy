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
    constructor(scope, id, branch, cert, _domainName, _protocol, props, _name) {
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
        const _taskImageOptions = {
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
        };
        const _taskSubnets = {
            subnets: [
                ec2.Subnet.fromSubnetId(this, 'pub-subnet-1', 'subnet-0d6ef10031ae3e8c0'),
                ec2.Subnet.fromSubnetId(this, 'pub-subnet-2', 'subnet-0d492e0e7f00f983e'),
            ]
        };
        const _securityGroups = [
            ec2.SecurityGroup.fromSecurityGroupId(this, 'madhouse-ecs-sg', 'sg-01cd17c4e6b52b54f', {
                mutable: true
            }),
            ec2.SecurityGroup.fromSecurityGroupId(this, 'madhouse-alb-sg', 'sg-04eafa4a188f6a837', {
                mutable: true
            }),
        ];
        if (_protocol === cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTPS) {
            const serviceProps = {
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
                protocol: _protocol,
                securityGroups: _securityGroups,
                taskSubnets: _taskSubnets,
                taskImageOptions: _taskImageOptions,
            };
            new ecs_patterns.ApplicationLoadBalancedFargateService(this, `fargate-service${name}`, serviceProps);
        }
        else if (_protocol === cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP) {
            const serviceProps = {
                cluster,
                memoryLimitMiB: 8192,
                desiredCount: 1,
                cpu: 2048,
                ephemeralStorageGiB: 30,
                assignPublicIp: true,
                listenerPort: 80,
                redirectHTTP: false,
                protocol: _protocol,
                securityGroups: _securityGroups,
                taskSubnets: _taskSubnets,
                taskImageOptions: _taskImageOptions,
            };
            new ecs_patterns.ApplicationLoadBalancedFargateService(this, `fargate-service${name}`, serviceProps);
        }
        // Instantiate Fargate Service with just cluster and image
    }
}
const app = new cdk.App();
new MadhouseFargate(app, 'madhouse', 'main', 'arn:aws:acm:us-east-1:145023121234:certificate/c934442e-84ed-4682-8a9d-eed1886a3ea4', 'app.madhousewallet.com', cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTPS, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});
new MadhouseFargate(app, 'uat', 'staging', 'arn:aws:acm:us-east-1:145023121234:certificate/5ca28edf-5484-4485-8b0a-ee84f1e61a80', 'staging.madhousewallet.com', cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTPS, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
}, 'staging');
new MadhouseFargate(app, 'dev', 'main', '', '', cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
}, 'dev');
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUE0QztBQUM1QywyQ0FBNEM7QUFDNUMsMkNBQTRDO0FBQzVDLDJDQUE0QztBQUM1QywrREFBOEQ7QUFDOUQsNkRBQThEO0FBQzlELG1DQUFvQztBQUdwQyxNQUFNLGVBQWdCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDckMsWUFBWSxLQUFjLEVBQUUsRUFBVSxFQUFFLE1BQWMsRUFDcEQsSUFBWSxFQUFFLFdBQW1CLEVBQ2pDLFNBQTZELEVBQzdELEtBQXNCLEVBQUUsS0FBYztRQUN0QyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLElBQUksR0FBRyxLQUFLLElBQUksRUFBRSxDQUFDO1FBRXpCLGlDQUFpQztRQUNqQyxvREFBb0Q7UUFDcEQsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQzFELEtBQUssRUFBRSx1QkFBdUI7WUFDOUIsaUJBQWlCLEVBQUUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDO1lBRS9DLG1DQUFtQztZQUNuQyxlQUFlLEVBQUUsQ0FBQywwQkFBMEIsRUFBRSwwQkFBMEIsQ0FBQztZQUN6RSxnQkFBZ0IsRUFBQyxDQUFDLDBCQUEwQixFQUFDLDBCQUEwQixDQUFDO1NBRXpFLENBQUMsQ0FBQztRQUVILE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRztZQUNsRSxVQUFVLEVBQUUsNkRBQTZEO1lBQ3pFLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxHQUFHLEVBQUUsR0FBRztZQUN6QyxjQUFjLEVBQUU7Z0JBQ2QsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUseUJBQXlC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Q0FBQyxFQUVGLFNBQVMsQ0FBQyxDQUFDO0FBRWpCLElBQUksZUFBZSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUMsTUFBTSxFQUNuQyxFQUFFLEVBQ0YsRUFBRSxFQUNGLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQ3ZEO0lBQ0EsR0FBRyxFQUFFO1FBQ0gsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO1FBQ3hDLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQjtLQUNuQztDQUFDLEVBRUYsS0FBSyxDQUFDLENBQUM7QUFHYixHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZWMyID0gcmVxdWlyZSgnYXdzLWNkay1saWIvYXdzLWVjMicpO1xyXG5pbXBvcnQgZWNzID0gcmVxdWlyZSgnYXdzLWNkay1saWIvYXdzLWVjcycpO1xyXG5pbXBvcnQgaWFtID0gcmVxdWlyZSgnYXdzLWNkay1saWIvYXdzLWlhbScpO1xyXG5pbXBvcnQgZWNyID0gcmVxdWlyZSgnYXdzLWNkay1saWIvYXdzLWVjcicpO1xyXG5pbXBvcnQgeyBEb2NrZXJJbWFnZUFzc2V0IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjci1hc3NldHMnO1xyXG5pbXBvcnQgZWNzX3BhdHRlcm5zID0gcmVxdWlyZSgnYXdzLWNkay1saWIvYXdzLWVjcy1wYXR0ZXJucycpO1xyXG5pbXBvcnQgY2RrID0gcmVxdWlyZSgnYXdzLWNkay1saWInKTtcclxuXHJcblxyXG5jbGFzcyBNYWRob3VzZUZhcmdhdGUgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQXBwLCBpZDogc3RyaW5nICxicmFuY2g6IHN0cmluZyxcclxuICAgIGNlcnQ6IHN0cmluZywgX2RvbWFpbk5hbWU6IHN0cmluZyxcclxuICAgIF9wcm90b2NvbDogY2RrLmF3c19lbGFzdGljbG9hZGJhbGFuY2luZ3YyLkFwcGxpY2F0aW9uUHJvdG9jb2wsXHJcbiAgICBwcm9wcz86IGNkay5TdGFja1Byb3BzLCBfbmFtZT86IHN0cmluZykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcbiAgICBcclxuICAgIGNvbnN0IG5hbWUgPSBfbmFtZSB8fCAnJztcclxuXHJcbiAgICAvLyBDcmVhdGUgVlBDIGFuZCBGYXJnYXRlIENsdXN0ZXJcclxuICAgIC8vIE5PVEU6IExpbWl0IEFacyB0byBhdm9pZCByZWFjaGluZyByZXNvdXJjZSBxdW90YXNcclxuICAgIGNvbnN0IHZwYyA9IGVjMi5WcGMuZnJvbVZwY0F0dHJpYnV0ZXModGhpcywgJ21hZGhvdXNlLXZwYycsIHtcclxuICAgICAgdnBjSWQ6ICd2cGMtMGI0NDI2YjZiMmM4MWIxMTcnLFxyXG4gICAgICBhdmFpbGFiaWxpdHlab25lczogWyd1cy1lYXN0LTFhJywgJ3VzLWVhc3QtMWInXSxcclxuICAgIFxyXG4gICAgICAvLyBFaXRoZXIgcGFzcyBsaXRlcmFscyBmb3IgYWxsIElEc1xyXG4gICAgICBwdWJsaWNTdWJuZXRJZHM6IFsnc3VibmV0LTBkNmVmMTAwMzFhZTNlOGMwJywgJ3N1Ym5ldC0wZDQ5MmUwZTdmMDBmOTgzZSddLFxyXG4gICAgICBwcml2YXRlU3VibmV0SWRzOlsnc3VibmV0LTA0YzVlYjk1NTY5ZDZmYzE5Jywnc3VibmV0LTBmYjM5NDdiNjZkMjUwMDI3J11cclxuICAgIFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIGNvbnN0IGNsdXN0ZXIgPSBlY3MuQ2x1c3Rlci5mcm9tQ2x1c3RlckF0dHJpYnV0ZXModGhpcywgJ2NsdXN0ZXInLCAge1xyXG4gICAgICBjbHVzdGVyQXJuOiAnYXJuOmF3czplY3M6dXMtZWFzdC0xOjE0NTAyMzEyMTIzNDpjbHVzdGVyL21hZGhvdXNlLWNsdXN0ZXInLFxyXG4gICAgICBjbHVzdGVyTmFtZTogXCJtYWRob3VzZS1jbHVzdGVyXCIsIHZwYzogdnBjLFxyXG4gICAgICBzZWN1cml0eUdyb3VwczogW1xyXG4gICAgICAgIGVjMi5TZWN1cml0eUdyb3VwLmZyb21TZWN1cml0eUdyb3VwSWQodGhpcywgJ21hZGhvdXNlLWVjcy1zZy1jbHVzdGVyJywgJ3NnLTAxY2QxN2M0ZTZiNTJiNTRmJywge1xyXG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZVxyXG4gICAgICAgIH0pLFxyXG4gICAgICBdXHJcblxyXG4gIH0pO1xyXG5cclxuICBjb25zdCByZXBvc2l0b3J5ID0gIGVjci5SZXBvc2l0b3J5LmZyb21SZXBvc2l0b3J5TmFtZSh0aGlzLCAnUmVwb3NpdG9yeScsIFxyXG4gICAgJ2Nkay1obmI2NTlmZHMtY29udGFpbmVyLWFzc2V0cy0xNDUwMjMxMjEyMzQtdXMtZWFzdC0xJyxcclxuICApO1xyXG5cclxuICBjb25zdCBlY3NSb2xlPSBpYW0uUm9sZS5mcm9tUm9sZUFybih0aGlzLCAnZWNzUm9sZScsXHJcbiAgICAnYXJuOmF3czppYW06OjE0NTAyMzEyMTIzNDpyb2xlL21hZGhvdXNlLWVjcy1yb2xlJyx7XHJcbiAgICAgIG11dGFibGU6IHRydWUsXHJcbiAgICB9KTtcclxuXHJcbiAgcmVwb3NpdG9yeS5ncmFudFB1bGwoZWNzUm9sZSk7XHJcblxyXG4gY29uc3QgX3Rhc2tJbWFnZU9wdGlvbnMgPSB7XHJcbiAgICBpbWFnZTogZWNzLkNvbnRhaW5lckltYWdlLmZyb21Eb2NrZXJJbWFnZUFzc2V0KFxyXG4gICAgICBuZXcgRG9ja2VySW1hZ2VBc3NldCh0aGlzLCBgbWFkaG91c2UtaW1hZ2Uke25hbWV9YCwge1xyXG4gICAgICBidWlsZEFyZ3M6e1xyXG4gICAgICAgIEJSQU5DSDogYnJhbmNoXHJcbiAgICAgIH0sXHJcbiAgICAgIGRpcmVjdG9yeTogJy4vZG9ja2VyJyxcclxuICAgICAgYXNzZXROYW1lOiAnbWFkaG91c2UtaW1hZ2UnLFxyXG4gICAgICBmaWxlOiAnRG9ja2VyZmlsZSdcclxuICAgIH0pKSxcclxuICAgIHRhc2tSb2xlOiAgZWNzUm9sZSxcclxuICAgIGV4ZWN1dGlvblJvbGU6ICBlY3NSb2xlLCBcclxuICB9XHJcblxyXG4gIGNvbnN0IF90YXNrU3VibmV0cyA9e1xyXG4gICAgc3VibmV0czogW1xyXG4gICAgICBlYzIuU3VibmV0LmZyb21TdWJuZXRJZCh0aGlzLCAncHViLXN1Ym5ldC0xJywgJ3N1Ym5ldC0wZDZlZjEwMDMxYWUzZThjMCcpLFxyXG4gICAgICBlYzIuU3VibmV0LmZyb21TdWJuZXRJZCh0aGlzLCAncHViLXN1Ym5ldC0yJywgJ3N1Ym5ldC0wZDQ5MmUwZTdmMDBmOTgzZScpLFxyXG4gICAgXVxyXG4gIH1cclxuXHJcbiAgY29uc3QgX3NlY3VyaXR5R3JvdXBzID0gWyAgICAgICAgXHJcbiAgICBlYzIuU2VjdXJpdHlHcm91cC5mcm9tU2VjdXJpdHlHcm91cElkKHRoaXMsICdtYWRob3VzZS1lY3Mtc2cnLCAnc2ctMDFjZDE3YzRlNmI1MmI1NGYnLCB7XHJcbiAgICBtdXRhYmxlOiB0cnVlXHJcbiAgfSksXHJcbiAgZWMyLlNlY3VyaXR5R3JvdXAuZnJvbVNlY3VyaXR5R3JvdXBJZCh0aGlzLCAnbWFkaG91c2UtYWxiLXNnJywgJ3NnLTA0ZWFmYTRhMTg4ZjZhODM3Jywge1xyXG4gICAgbXV0YWJsZTogdHJ1ZVxyXG4gIH0pLFxyXG5dXHJcbmlmKF9wcm90b2NvbCA9PT0gY2RrLmF3c19lbGFzdGljbG9hZGJhbGFuY2luZ3YyLkFwcGxpY2F0aW9uUHJvdG9jb2wuSFRUUFMpe1xyXG4gICAgICBjb25zdCBzZXJ2aWNlUHJvcHMgPSB7XHJcbiAgICAgICAgY2x1c3RlcixcclxuICAgICAgICBcclxuICAgICAgICBtZW1vcnlMaW1pdE1pQjogODE5MixcclxuICAgICAgICBkZXNpcmVkQ291bnQ6IDEsXHJcbiAgICAgICAgY3B1OiAyMDQ4LFxyXG4gICAgICAgIGVwaGVtZXJhbFN0b3JhZ2VHaUI6IDMwLFxyXG4gICAgICAgICAgXHJcbiAgICAgICAgYXNzaWduUHVibGljSXA6IHRydWUsXHJcbiAgICAgICAgbGlzdGVuZXJQb3J0OiA0NDMsXHJcbiAgICAgICAgcmVkaXJlY3RIVFRQOiB0cnVlLFxyXG4gICAgICAgIGNlcnRpZmljYXRlOmNkay5hd3NfY2VydGlmaWNhdGVtYW5hZ2VyLkNlcnRpZmljYXRlLmZyb21DZXJ0aWZpY2F0ZUFybih0aGlzLFxyXG4gICAgICAgICAgJ21hZGhvdXNlLWNlcnQnLGNlcnQgKSxcclxuICAgICAgICBkb21haW5OYW1lOiBfZG9tYWluTmFtZSxcclxuICAgICAgICBkb21haW5ab25lOiBjZGsuYXdzX3JvdXRlNTMuSG9zdGVkWm9uZS5mcm9tTG9va3VwKHRoaXMsXHJcbiAgICAgICAgICAnbWFkaG91c2UtaG9zdGVkem9uZScse2RvbWFpbk5hbWU6ICdtYWRob3VzZXdhbGxldC5jb20nLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgIH1cclxuICAgICAgICApLFxyXG4gICAgICAgIHByb3RvY29sOiBfcHJvdG9jb2wsXHJcbiAgICAgICAgc2VjdXJpdHlHcm91cHM6X3NlY3VyaXR5R3JvdXBzLFxyXG4gICAgICAgIHRhc2tTdWJuZXRzOiBfdGFza1N1Ym5ldHMsXHJcbiAgICAgICAgdGFza0ltYWdlT3B0aW9uczogX3Rhc2tJbWFnZU9wdGlvbnMsXHJcbiAgICAgIH1cclxuICAgIG5ldyBlY3NfcGF0dGVybnMuQXBwbGljYXRpb25Mb2FkQmFsYW5jZWRGYXJnYXRlU2VydmljZSh0aGlzLCBgZmFyZ2F0ZS1zZXJ2aWNlJHtuYW1lfWAsc2VydmljZVByb3BzICk7XHJcblxyXG4gICAgfWVsc2UgaWYoX3Byb3RvY29sID09PSBjZGsuYXdzX2VsYXN0aWNsb2FkYmFsYW5jaW5ndjIuQXBwbGljYXRpb25Qcm90b2NvbC5IVFRQKXtcclxuICAgICAgIGNvbnN0IHNlcnZpY2VQcm9wcyA9IHtcclxuICAgICAgICAgIGNsdXN0ZXIsXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIG1lbW9yeUxpbWl0TWlCOiA4MTkyLFxyXG4gICAgICAgICAgZGVzaXJlZENvdW50OiAxLFxyXG4gICAgICAgICAgY3B1OiAyMDQ4LFxyXG4gICAgICAgICAgZXBoZW1lcmFsU3RvcmFnZUdpQjogMzAsXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgYXNzaWduUHVibGljSXA6IHRydWUsXHJcbiAgICAgICAgICBsaXN0ZW5lclBvcnQ6IDgwLFxyXG4gICAgICAgICAgcmVkaXJlY3RIVFRQOiBmYWxzZSxcclxuICAgICAgICAgIHByb3RvY29sOiBfcHJvdG9jb2wsXHJcbiAgICAgICAgICBzZWN1cml0eUdyb3Vwczpfc2VjdXJpdHlHcm91cHMsXHJcbiAgICAgICAgICB0YXNrU3VibmV0czogX3Rhc2tTdWJuZXRzLFxyXG4gICAgICAgICAgdGFza0ltYWdlT3B0aW9uczogX3Rhc2tJbWFnZU9wdGlvbnMsXHJcbiAgICAgICAgfVxyXG4gICAgICAgIG5ldyBlY3NfcGF0dGVybnMuQXBwbGljYXRpb25Mb2FkQmFsYW5jZWRGYXJnYXRlU2VydmljZSh0aGlzLCBgZmFyZ2F0ZS1zZXJ2aWNlJHtuYW1lfWAsc2VydmljZVByb3BzICk7XHJcbiAgICAgIH1cclxuICAgIC8vIEluc3RhbnRpYXRlIEZhcmdhdGUgU2VydmljZSB3aXRoIGp1c3QgY2x1c3RlciBhbmQgaW1hZ2VcclxuICAgIFxyXG4gIH1cclxufVxyXG5cclxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcclxuXHJcbm5ldyBNYWRob3VzZUZhcmdhdGUoYXBwLCAnbWFkaG91c2UnLCdtYWluJyxcclxuICAnYXJuOmF3czphY206dXMtZWFzdC0xOjE0NTAyMzEyMTIzNDpjZXJ0aWZpY2F0ZS9jOTM0NDQyZS04NGVkLTQ2ODItOGE5ZC1lZWQxODg2YTNlYTQnLFxyXG4gICdhcHAubWFkaG91c2V3YWxsZXQuY29tJyxcclxuICBjZGsuYXdzX2VsYXN0aWNsb2FkYmFsYW5jaW5ndjIuQXBwbGljYXRpb25Qcm90b2NvbC5IVFRQU1xyXG4gICx7XHJcbiAgZW52OiB7XHJcbiAgICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULFxyXG4gICAgcmVnaW9uOiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9SRUdJT05cclxuICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbm5ldyBNYWRob3VzZUZhcmdhdGUoYXBwLCAndWF0Jywnc3RhZ2luZycsXHJcbiAgJ2Fybjphd3M6YWNtOnVzLWVhc3QtMToxNDUwMjMxMjEyMzQ6Y2VydGlmaWNhdGUvNWNhMjhlZGYtNTQ4NC00NDg1LThiMGEtZWU4NGYxZTYxYTgwJyxcclxuICAnc3RhZ2luZy5tYWRob3VzZXdhbGxldC5jb20nLFxyXG4gIGNkay5hd3NfZWxhc3RpY2xvYWRiYWxhbmNpbmd2Mi5BcHBsaWNhdGlvblByb3RvY29sLkhUVFBTLFxyXG4gIHtcclxuICBlbnY6IHtcclxuICAgIGFjY291bnQ6IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQsXHJcbiAgICByZWdpb246IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTlxyXG4gICAgICB9fSxcclxuICAgICAgXHJcbiAgICAgICdzdGFnaW5nJyk7XHJcblxyXG5uZXcgTWFkaG91c2VGYXJnYXRlKGFwcCwgJ2RldicsJ21haW4nLFxyXG4gICcnLFxyXG4gICcnLFxyXG4gIGNkay5hd3NfZWxhc3RpY2xvYWRiYWxhbmNpbmd2Mi5BcHBsaWNhdGlvblByb3RvY29sLkhUVFAsXHJcbiAge1xyXG4gIGVudjoge1xyXG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcclxuICAgIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OXHJcbiAgICAgIH19LFxyXG4gICAgICBcclxuICAgICAgJ2RldicpO1xyXG5cclxuXHJcbmFwcC5zeW50aCgpO1xyXG5cclxuIl19