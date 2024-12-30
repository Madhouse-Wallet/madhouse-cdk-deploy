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
            assignPublicIp: true,
            listenerPort: 80,
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
new MadhouseFargate(app, 'madhouse');
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDJDQUE0QztBQUM1QywyQ0FBNEM7QUFDNUMsMkNBQTRDO0FBQzVDLDJDQUE0QztBQUM1QywrREFBOEQ7QUFDOUQsNkRBQThEO0FBQzlELG1DQUFvQztBQUVwQyxNQUFNLGVBQWdCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDckMsWUFBWSxLQUFjLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGlDQUFpQztRQUNqQyxvREFBb0Q7UUFDcEQsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQzFELEtBQUssRUFBRSx1QkFBdUI7WUFDOUIsaUJBQWlCLEVBQUUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDO1lBRS9DLG1DQUFtQztZQUNuQyxlQUFlLEVBQUUsQ0FBQywwQkFBMEIsRUFBRSwwQkFBMEIsQ0FBQztZQUN6RSxnQkFBZ0IsRUFBQyxDQUFDLDBCQUEwQixFQUFDLDBCQUEwQixDQUFDO1NBRXpFLENBQUMsQ0FBQztRQUVILE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRztZQUNsRSxVQUFVLEVBQUUsNkRBQTZEO1lBQ3pFLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxHQUFHLEVBQUUsR0FBRztZQUN6QyxjQUFjLEVBQUU7Z0JBQ2QsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUseUJBQXlCLEVBQUUsc0JBQXNCLEVBQUU7b0JBQzdGLE9BQU8sRUFBRSxJQUFJO2lCQUNkLENBQUM7YUFDSDtTQUVKLENBQUMsQ0FBQztRQUVILE1BQU0sVUFBVSxHQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFDdEUsdURBQXVELENBQ3hELENBQUM7UUFFRixNQUFNLE9BQU8sR0FBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUNqRCxrREFBa0QsRUFBQztZQUNqRCxPQUFPLEVBQUUsSUFBSTtTQUNkLENBQUMsQ0FBQztRQUVMLFVBQVUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFNUIsMERBQTBEO1FBQzFELElBQUksWUFBWSxDQUFDLHFDQUFxQyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUM5RSxPQUFPO1lBQ1AsY0FBYyxFQUFFLElBQUk7WUFDcEIsWUFBWSxFQUFDLEVBQUU7WUFDZixjQUFjLEVBQUM7Z0JBQ2IsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsc0JBQXNCLEVBQUU7b0JBQ3ZGLE9BQU8sRUFBRSxJQUFJO2lCQUNkLENBQUM7Z0JBQ0YsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsc0JBQXNCLEVBQUU7b0JBQ3JGLE9BQU8sRUFBRSxJQUFJO2lCQUNkLENBQUM7YUFDSDtZQUNDLFdBQVcsRUFBRTtnQkFDWCxPQUFPLEVBQUU7b0JBQ1AsR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSwwQkFBMEIsQ0FBQztvQkFDekUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSwwQkFBMEIsQ0FBQztpQkFDMUU7YUFDRjtZQUNELGdCQUFnQixFQUFFO2dCQUNoQixLQUFLLEVBQUUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FDNUMsSUFBSSxpQ0FBZ0IsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7b0JBQzdDLFNBQVMsRUFBRSxVQUFVO29CQUNyQixTQUFTLEVBQUUsZ0JBQWdCO29CQUMzQixJQUFJLEVBQUUsWUFBWTtpQkFDbkIsQ0FBQyxDQUFDO2dCQUNILFFBQVEsRUFBRyxPQUFPO2dCQUNsQixhQUFhLEVBQUcsT0FBTzthQUN4QjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQUdELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLElBQUksZUFBZSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUVyQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZWMyID0gcmVxdWlyZSgnYXdzLWNkay1saWIvYXdzLWVjMicpO1xyXG5pbXBvcnQgZWNzID0gcmVxdWlyZSgnYXdzLWNkay1saWIvYXdzLWVjcycpO1xyXG5pbXBvcnQgaWFtID0gcmVxdWlyZSgnYXdzLWNkay1saWIvYXdzLWlhbScpO1xyXG5pbXBvcnQgZWNyID0gcmVxdWlyZSgnYXdzLWNkay1saWIvYXdzLWVjcicpO1xyXG5pbXBvcnQgeyBEb2NrZXJJbWFnZUFzc2V0IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjci1hc3NldHMnO1xyXG5pbXBvcnQgZWNzX3BhdHRlcm5zID0gcmVxdWlyZSgnYXdzLWNkay1saWIvYXdzLWVjcy1wYXR0ZXJucycpO1xyXG5pbXBvcnQgY2RrID0gcmVxdWlyZSgnYXdzLWNkay1saWInKTtcclxuXHJcbmNsYXNzIE1hZGhvdXNlRmFyZ2F0ZSBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5BcHAsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIC8vIENyZWF0ZSBWUEMgYW5kIEZhcmdhdGUgQ2x1c3RlclxyXG4gICAgLy8gTk9URTogTGltaXQgQVpzIHRvIGF2b2lkIHJlYWNoaW5nIHJlc291cmNlIHF1b3Rhc1xyXG4gICAgY29uc3QgdnBjID0gZWMyLlZwYy5mcm9tVnBjQXR0cmlidXRlcyh0aGlzLCAnbWFkaG91c2UtdnBjJywge1xyXG4gICAgICB2cGNJZDogJ3ZwYy0wYjQ0MjZiNmIyYzgxYjExNycsXHJcbiAgICAgIGF2YWlsYWJpbGl0eVpvbmVzOiBbJ3VzLWVhc3QtMWEnLCAndXMtZWFzdC0xYiddLFxyXG4gICAgXHJcbiAgICAgIC8vIEVpdGhlciBwYXNzIGxpdGVyYWxzIGZvciBhbGwgSURzXHJcbiAgICAgIHB1YmxpY1N1Ym5ldElkczogWydzdWJuZXQtMGQ2ZWYxMDAzMWFlM2U4YzAnLCAnc3VibmV0LTBkNDkyZTBlN2YwMGY5ODNlJ10sXHJcbiAgICAgIHByaXZhdGVTdWJuZXRJZHM6WydzdWJuZXQtMDRjNWViOTU1NjlkNmZjMTknLCdzdWJuZXQtMGZiMzk0N2I2NmQyNTAwMjcnXVxyXG4gICAgXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgY29uc3QgY2x1c3RlciA9IGVjcy5DbHVzdGVyLmZyb21DbHVzdGVyQXR0cmlidXRlcyh0aGlzLCAnY2x1c3RlcicsICB7XHJcbiAgICAgIGNsdXN0ZXJBcm46ICdhcm46YXdzOmVjczp1cy1lYXN0LTE6MTQ1MDIzMTIxMjM0OmNsdXN0ZXIvbWFkaG91c2UtY2x1c3RlcicsXHJcbiAgICAgIGNsdXN0ZXJOYW1lOiBcIm1hZGhvdXNlLWNsdXN0ZXJcIiwgdnBjOiB2cGMsXHJcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbXHJcbiAgICAgICAgZWMyLlNlY3VyaXR5R3JvdXAuZnJvbVNlY3VyaXR5R3JvdXBJZCh0aGlzLCAnbWFkaG91c2UtZWNzLXNnLWNsdXN0ZXInLCAnc2ctMDFjZDE3YzRlNmI1MmI1NGYnLCB7XHJcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlXHJcbiAgICAgICAgfSksXHJcbiAgICAgIF1cclxuXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHJlcG9zaXRvcnkgPSAgZWNyLlJlcG9zaXRvcnkuZnJvbVJlcG9zaXRvcnlOYW1lKHRoaXMsICdSZXBvc2l0b3J5JywgXHJcbiAgICAnY2RrLWhuYjY1OWZkcy1jb250YWluZXItYXNzZXRzLTE0NTAyMzEyMTIzNC11cy1lYXN0LTEnLFxyXG4gICk7XHJcblxyXG4gIGNvbnN0IGVjc1JvbGU9IGlhbS5Sb2xlLmZyb21Sb2xlQXJuKHRoaXMsICdlY3NSb2xlJyxcclxuICAgICdhcm46YXdzOmlhbTo6MTQ1MDIzMTIxMjM0OnJvbGUvbWFkaG91c2UtZWNzLXJvbGUnLHtcclxuICAgICAgbXV0YWJsZTogdHJ1ZSxcclxuICAgIH0pO1xyXG5cclxuICByZXBvc2l0b3J5LmdyYW50UHVsbChlY3NSb2xlKTtcclxuXHJcbiAgICAvLyBJbnN0YW50aWF0ZSBGYXJnYXRlIFNlcnZpY2Ugd2l0aCBqdXN0IGNsdXN0ZXIgYW5kIGltYWdlXHJcbiAgICBuZXcgZWNzX3BhdHRlcm5zLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VkRmFyZ2F0ZVNlcnZpY2UodGhpcywgXCJmYXJnYXRlLXNlcnZpY2VcIiwge1xyXG4gICAgICBjbHVzdGVyLFxyXG4gICAgICBhc3NpZ25QdWJsaWNJcDogdHJ1ZSxcclxuICAgICAgbGlzdGVuZXJQb3J0OjgwLFxyXG4gICAgICBzZWN1cml0eUdyb3VwczpbICAgICAgICBcclxuICAgICAgICBlYzIuU2VjdXJpdHlHcm91cC5mcm9tU2VjdXJpdHlHcm91cElkKHRoaXMsICdtYWRob3VzZS1lY3Mtc2cnLCAnc2ctMDFjZDE3YzRlNmI1MmI1NGYnLCB7XHJcbiAgICAgICAgbXV0YWJsZTogdHJ1ZVxyXG4gICAgICB9KSxcclxuICAgICAgZWMyLlNlY3VyaXR5R3JvdXAuZnJvbVNlY3VyaXR5R3JvdXBJZCh0aGlzLCAnbWFkaG91c2UtYWxiLXNnJywgJ3NnLTA0ZWFmYTRhMTg4ZjZhODM3Jywge1xyXG4gICAgICAgIG11dGFibGU6IHRydWVcclxuICAgICAgfSksXHJcbiAgICBdLFxyXG4gICAgICB0YXNrU3VibmV0czoge1xyXG4gICAgICAgIHN1Ym5ldHM6IFtcclxuICAgICAgICAgIGVjMi5TdWJuZXQuZnJvbVN1Ym5ldElkKHRoaXMsICdwdWItc3VibmV0LTEnLCAnc3VibmV0LTBkNmVmMTAwMzFhZTNlOGMwJyksXHJcbiAgICAgICAgICBlYzIuU3VibmV0LmZyb21TdWJuZXRJZCh0aGlzLCAncHViLXN1Ym5ldC0yJywgJ3N1Ym5ldC0wZDQ5MmUwZTdmMDBmOTgzZScpLFxyXG4gICAgICAgIF1cclxuICAgICAgfSxcclxuICAgICAgdGFza0ltYWdlT3B0aW9uczoge1xyXG4gICAgICAgIGltYWdlOiBlY3MuQ29udGFpbmVySW1hZ2UuZnJvbURvY2tlckltYWdlQXNzZXQoXHJcbiAgICAgICAgICBuZXcgRG9ja2VySW1hZ2VBc3NldCh0aGlzLCAnbWFkaG91c2UtaW1hZ2UnLCB7XHJcbiAgICAgICAgICBkaXJlY3Rvcnk6ICcuL2RvY2tlcicsXHJcbiAgICAgICAgICBhc3NldE5hbWU6ICdtYWRob3VzZS1pbWFnZScsXHJcbiAgICAgICAgICBmaWxlOiAnRG9ja2VyZmlsZSdcclxuICAgICAgICB9KSksXHJcbiAgICAgICAgdGFza1JvbGU6ICBlY3NSb2xlLFxyXG4gICAgICAgIGV4ZWN1dGlvblJvbGU6ICBlY3NSb2xlLCBcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuXHJcbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XHJcblxyXG5uZXcgTWFkaG91c2VGYXJnYXRlKGFwcCwgJ21hZGhvdXNlJyk7XHJcblxyXG5hcHAuc3ludGgoKTtcclxuIl19