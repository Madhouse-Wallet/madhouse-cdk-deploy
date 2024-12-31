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
    constructor(scope, id, props) {
        super(scope, id, props);
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
        new ecs_patterns.ApplicationLoadBalancedFargateService(this, "fargate-service", {
            cluster,
            memoryLimitMiB: 8192,
            desiredCount: 1,
            cpu: 2048,
            ephemeralStorageGiB: 30,
            assignPublicIp: true,
            listenerPort: 443,
            redirectHTTP: true,
            certificate: cdk.aws_certificatemanager.Certificate.fromCertificateArn(this, 'madhouse-cert', 'arn:aws:acm:us-east-1:145023121234:certificate/c934442e-84ed-4682-8a9d-eed1886a3ea4'),
            domainName: 'app.madhousewallet.com',
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
                image: ecs.ContainerImage.fromDockerImageAsset(new aws_ecr_assets_1.DockerImageAsset(this, 'madhouse-image', {
                    buildArgs: {
                        BRANCH: 'main'
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
new MadhouseFargate(app, 'madhouse', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUE0QztBQUM1QywyQ0FBNEM7QUFDNUMsMkNBQTRDO0FBQzVDLDJDQUE0QztBQUM1QywrREFBOEQ7QUFDOUQsNkRBQThEO0FBQzlELG1DQUFvQztBQUVwQyxNQUFNLGVBQWdCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDckMsWUFBWSxLQUFjLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGlDQUFpQztRQUNqQyxvREFBb0Q7UUFDcEQsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQzFELEtBQUssRUFBRSx1QkFBdUI7WUFDOUIsaUJBQWlCLEVBQUUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDO1lBRS9DLG1DQUFtQztZQUNuQyxlQUFlLEVBQUUsQ0FBQywwQkFBMEIsRUFBRSwwQkFBMEIsQ0FBQztZQUN6RSxnQkFBZ0IsRUFBQyxDQUFDLDBCQUEwQixFQUFDLDBCQUEwQixDQUFDO1NBRXpFLENBQUMsQ0FBQztRQUVILE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRztZQUNsRSxVQUFVLEVBQUUsNkRBQTZEO1lBQ3pFLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxHQUFHLEVBQUUsR0FBRztZQUN6QyxjQUFjLEVBQUU7Z0JBQ2QsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUseUJBQXlCLEVBQUUsc0JBQXNCLEVBQUU7b0JBQzdGLE9BQU8sRUFBRSxJQUFJO2lCQUNkLENBQUM7YUFDSDtTQUVKLENBQUMsQ0FBQztRQUVILE1BQU0sVUFBVSxHQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFDdEUsdURBQXVELENBQ3hELENBQUM7UUFFRixNQUFNLE9BQU8sR0FBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUNqRCxrREFBa0QsRUFBQztZQUNqRCxPQUFPLEVBQUUsSUFBSTtTQUNkLENBQUMsQ0FBQztRQUVMLFVBQVUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFNUIsMERBQTBEO1FBQzFELElBQUksWUFBWSxDQUFDLHFDQUFxQyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUM5RSxPQUFPO1lBRUwsY0FBYyxFQUFFLElBQUk7WUFDcEIsWUFBWSxFQUFFLENBQUM7WUFDZixHQUFHLEVBQUUsSUFBSTtZQUNULG1CQUFtQixFQUFFLEVBQUU7WUFFekIsY0FBYyxFQUFFLElBQUk7WUFDcEIsWUFBWSxFQUFFLEdBQUc7WUFDakIsWUFBWSxFQUFFLElBQUk7WUFDbEIsV0FBVyxFQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUN4RSxlQUFlLEVBQUMscUZBQXFGLENBQUU7WUFDekcsVUFBVSxFQUFFLHdCQUF3QjtZQUNwQyxVQUFVLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksRUFDcEQscUJBQXFCLEVBQUMsRUFBQyxVQUFVLEVBQUUsb0JBQW9CO2FBRXJELENBQ0g7WUFDRCxRQUFRLEVBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLG1CQUFtQixDQUFDLEtBQUs7WUFDakUsY0FBYyxFQUFDO2dCQUNiLEdBQUcsQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFLHNCQUFzQixFQUFFO29CQUN2RixPQUFPLEVBQUUsSUFBSTtpQkFDZCxDQUFDO2dCQUNGLEdBQUcsQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFLHNCQUFzQixFQUFFO29CQUNyRixPQUFPLEVBQUUsSUFBSTtpQkFDZCxDQUFDO2FBQ0g7WUFDQyxXQUFXLEVBQUU7Z0JBQ1gsT0FBTyxFQUFFO29CQUNQLEdBQUcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsMEJBQTBCLENBQUM7b0JBQ3pFLEdBQUcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsMEJBQTBCLENBQUM7aUJBQzFFO2FBQ0Y7WUFDRCxnQkFBZ0IsRUFBRTtnQkFDaEIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQzVDLElBQUksaUNBQWdCLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO29CQUM3QyxTQUFTLEVBQUM7d0JBQ1IsTUFBTSxFQUFDLE1BQU07cUJBQ2Q7b0JBQ0QsU0FBUyxFQUFFLFVBQVU7b0JBQ3JCLFNBQVMsRUFBRSxnQkFBZ0I7b0JBQzNCLElBQUksRUFBRSxZQUFZO2lCQUNuQixDQUFDLENBQUM7Z0JBQ0gsUUFBUSxFQUFHLE9BQU87Z0JBQ2xCLGFBQWEsRUFBRyxPQUFPO2FBQ3hCO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBR0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsSUFBSSxlQUFlLENBQUMsR0FBRyxFQUFFLFVBQVUsRUFBQztJQUNsQyxHQUFHLEVBQUU7UUFDSCxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUI7UUFDeEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCO0tBQ3pDO0NBQUMsQ0FBQyxDQUFDO0FBRUosR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGVjMiA9IHJlcXVpcmUoJ2F3cy1jZGstbGliL2F3cy1lYzInKTtcclxuaW1wb3J0IGVjcyA9IHJlcXVpcmUoJ2F3cy1jZGstbGliL2F3cy1lY3MnKTtcclxuaW1wb3J0IGlhbSA9IHJlcXVpcmUoJ2F3cy1jZGstbGliL2F3cy1pYW0nKTtcclxuaW1wb3J0IGVjciA9IHJlcXVpcmUoJ2F3cy1jZGstbGliL2F3cy1lY3InKTtcclxuaW1wb3J0IHsgRG9ja2VySW1hZ2VBc3NldCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3ItYXNzZXRzJztcclxuaW1wb3J0IGVjc19wYXR0ZXJucyA9IHJlcXVpcmUoJ2F3cy1jZGstbGliL2F3cy1lY3MtcGF0dGVybnMnKTtcclxuaW1wb3J0IGNkayA9IHJlcXVpcmUoJ2F3cy1jZGstbGliJyk7XHJcblxyXG5jbGFzcyBNYWRob3VzZUZhcmdhdGUgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQXBwLCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgVlBDIGFuZCBGYXJnYXRlIENsdXN0ZXJcclxuICAgIC8vIE5PVEU6IExpbWl0IEFacyB0byBhdm9pZCByZWFjaGluZyByZXNvdXJjZSBxdW90YXNcclxuICAgIGNvbnN0IHZwYyA9IGVjMi5WcGMuZnJvbVZwY0F0dHJpYnV0ZXModGhpcywgJ21hZGhvdXNlLXZwYycsIHtcclxuICAgICAgdnBjSWQ6ICd2cGMtMGI0NDI2YjZiMmM4MWIxMTcnLFxyXG4gICAgICBhdmFpbGFiaWxpdHlab25lczogWyd1cy1lYXN0LTFhJywgJ3VzLWVhc3QtMWInXSxcclxuICAgIFxyXG4gICAgICAvLyBFaXRoZXIgcGFzcyBsaXRlcmFscyBmb3IgYWxsIElEc1xyXG4gICAgICBwdWJsaWNTdWJuZXRJZHM6IFsnc3VibmV0LTBkNmVmMTAwMzFhZTNlOGMwJywgJ3N1Ym5ldC0wZDQ5MmUwZTdmMDBmOTgzZSddLFxyXG4gICAgICBwcml2YXRlU3VibmV0SWRzOlsnc3VibmV0LTA0YzVlYjk1NTY5ZDZmYzE5Jywnc3VibmV0LTBmYjM5NDdiNjZkMjUwMDI3J11cclxuICAgIFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIGNvbnN0IGNsdXN0ZXIgPSBlY3MuQ2x1c3Rlci5mcm9tQ2x1c3RlckF0dHJpYnV0ZXModGhpcywgJ2NsdXN0ZXInLCAge1xyXG4gICAgICBjbHVzdGVyQXJuOiAnYXJuOmF3czplY3M6dXMtZWFzdC0xOjE0NTAyMzEyMTIzNDpjbHVzdGVyL21hZGhvdXNlLWNsdXN0ZXInLFxyXG4gICAgICBjbHVzdGVyTmFtZTogXCJtYWRob3VzZS1jbHVzdGVyXCIsIHZwYzogdnBjLFxyXG4gICAgICBzZWN1cml0eUdyb3VwczogW1xyXG4gICAgICAgIGVjMi5TZWN1cml0eUdyb3VwLmZyb21TZWN1cml0eUdyb3VwSWQodGhpcywgJ21hZGhvdXNlLWVjcy1zZy1jbHVzdGVyJywgJ3NnLTAxY2QxN2M0ZTZiNTJiNTRmJywge1xyXG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZVxyXG4gICAgICAgIH0pLFxyXG4gICAgICBdXHJcblxyXG4gIH0pO1xyXG5cclxuICBjb25zdCByZXBvc2l0b3J5ID0gIGVjci5SZXBvc2l0b3J5LmZyb21SZXBvc2l0b3J5TmFtZSh0aGlzLCAnUmVwb3NpdG9yeScsIFxyXG4gICAgJ2Nkay1obmI2NTlmZHMtY29udGFpbmVyLWFzc2V0cy0xNDUwMjMxMjEyMzQtdXMtZWFzdC0xJyxcclxuICApO1xyXG5cclxuICBjb25zdCBlY3NSb2xlPSBpYW0uUm9sZS5mcm9tUm9sZUFybih0aGlzLCAnZWNzUm9sZScsXHJcbiAgICAnYXJuOmF3czppYW06OjE0NTAyMzEyMTIzNDpyb2xlL21hZGhvdXNlLWVjcy1yb2xlJyx7XHJcbiAgICAgIG11dGFibGU6IHRydWUsXHJcbiAgICB9KTtcclxuXHJcbiAgcmVwb3NpdG9yeS5ncmFudFB1bGwoZWNzUm9sZSk7XHJcblxyXG4gICAgLy8gSW5zdGFudGlhdGUgRmFyZ2F0ZSBTZXJ2aWNlIHdpdGgganVzdCBjbHVzdGVyIGFuZCBpbWFnZVxyXG4gICAgbmV3IGVjc19wYXR0ZXJucy5BcHBsaWNhdGlvbkxvYWRCYWxhbmNlZEZhcmdhdGVTZXJ2aWNlKHRoaXMsIFwiZmFyZ2F0ZS1zZXJ2aWNlXCIsIHtcclxuICAgICAgY2x1c3RlcixcclxuICAgICAgXHJcbiAgICAgICAgbWVtb3J5TGltaXRNaUI6IDgxOTIsXHJcbiAgICAgICAgZGVzaXJlZENvdW50OiAxLFxyXG4gICAgICAgIGNwdTogMjA0OCxcclxuICAgICAgICBlcGhlbWVyYWxTdG9yYWdlR2lCOiAzMCxcclxuICAgICAgICBcclxuICAgICAgYXNzaWduUHVibGljSXA6IHRydWUsXHJcbiAgICAgIGxpc3RlbmVyUG9ydDogNDQzLFxyXG4gICAgICByZWRpcmVjdEhUVFA6IHRydWUsXHJcbiAgICAgIGNlcnRpZmljYXRlOmNkay5hd3NfY2VydGlmaWNhdGVtYW5hZ2VyLkNlcnRpZmljYXRlLmZyb21DZXJ0aWZpY2F0ZUFybih0aGlzLFxyXG4gICAgICAgICdtYWRob3VzZS1jZXJ0JywnYXJuOmF3czphY206dXMtZWFzdC0xOjE0NTAyMzEyMTIzNDpjZXJ0aWZpY2F0ZS9jOTM0NDQyZS04NGVkLTQ2ODItOGE5ZC1lZWQxODg2YTNlYTQnICksXHJcbiAgICAgIGRvbWFpbk5hbWU6ICdhcHAubWFkaG91c2V3YWxsZXQuY29tJyxcclxuICAgICAgZG9tYWluWm9uZTogY2RrLmF3c19yb3V0ZTUzLkhvc3RlZFpvbmUuZnJvbUxvb2t1cCh0aGlzLFxyXG4gICAgICAgICdtYWRob3VzZS1ob3N0ZWR6b25lJyx7ZG9tYWluTmFtZTogJ21hZGhvdXNld2FsbGV0LmNvbScsXHJcbiAgICAgICAgICBcclxuICAgICAgICAgfVxyXG4gICAgICApLFxyXG4gICAgICBwcm90b2NvbDpjZGsuYXdzX2VsYXN0aWNsb2FkYmFsYW5jaW5ndjIuQXBwbGljYXRpb25Qcm90b2NvbC5IVFRQUyxcclxuICAgICAgc2VjdXJpdHlHcm91cHM6WyAgICAgICAgXHJcbiAgICAgICAgZWMyLlNlY3VyaXR5R3JvdXAuZnJvbVNlY3VyaXR5R3JvdXBJZCh0aGlzLCAnbWFkaG91c2UtZWNzLXNnJywgJ3NnLTAxY2QxN2M0ZTZiNTJiNTRmJywge1xyXG4gICAgICAgIG11dGFibGU6IHRydWVcclxuICAgICAgfSksXHJcbiAgICAgIGVjMi5TZWN1cml0eUdyb3VwLmZyb21TZWN1cml0eUdyb3VwSWQodGhpcywgJ21hZGhvdXNlLWFsYi1zZycsICdzZy0wNGVhZmE0YTE4OGY2YTgzNycsIHtcclxuICAgICAgICBtdXRhYmxlOiB0cnVlXHJcbiAgICAgIH0pLFxyXG4gICAgXSxcclxuICAgICAgdGFza1N1Ym5ldHM6IHtcclxuICAgICAgICBzdWJuZXRzOiBbXHJcbiAgICAgICAgICBlYzIuU3VibmV0LmZyb21TdWJuZXRJZCh0aGlzLCAncHViLXN1Ym5ldC0xJywgJ3N1Ym5ldC0wZDZlZjEwMDMxYWUzZThjMCcpLFxyXG4gICAgICAgICAgZWMyLlN1Ym5ldC5mcm9tU3VibmV0SWQodGhpcywgJ3B1Yi1zdWJuZXQtMicsICdzdWJuZXQtMGQ0OTJlMGU3ZjAwZjk4M2UnKSxcclxuICAgICAgICBdXHJcbiAgICAgIH0sXHJcbiAgICAgIHRhc2tJbWFnZU9wdGlvbnM6IHtcclxuICAgICAgICBpbWFnZTogZWNzLkNvbnRhaW5lckltYWdlLmZyb21Eb2NrZXJJbWFnZUFzc2V0KFxyXG4gICAgICAgICAgbmV3IERvY2tlckltYWdlQXNzZXQodGhpcywgJ21hZGhvdXNlLWltYWdlJywge1xyXG4gICAgICAgICAgYnVpbGRBcmdzOntcclxuICAgICAgICAgICAgQlJBTkNIOidtYWluJ1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGRpcmVjdG9yeTogJy4vZG9ja2VyJyxcclxuICAgICAgICAgIGFzc2V0TmFtZTogJ21hZGhvdXNlLWltYWdlJyxcclxuICAgICAgICAgIGZpbGU6ICdEb2NrZXJmaWxlJ1xyXG4gICAgICAgIH0pKSxcclxuICAgICAgICB0YXNrUm9sZTogIGVjc1JvbGUsXHJcbiAgICAgICAgZXhlY3V0aW9uUm9sZTogIGVjc1JvbGUsIFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5cclxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcclxuXHJcbm5ldyBNYWRob3VzZUZhcmdhdGUoYXBwLCAnbWFkaG91c2UnLHtcclxuICBlbnY6IHtcclxuICAgIGFjY291bnQ6IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQsXHJcbiAgICByZWdpb246IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTlxyXG59fSk7XHJcblxyXG5hcHAuc3ludGgoKTtcclxuIl19