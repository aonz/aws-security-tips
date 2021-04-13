import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import * as rds from '@aws-cdk/aws-rds';

import * as path from 'path';

export class IamDatabaseAuthenticationStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', { cidr: '10.0.0.0/16' });

    const rdsInstance = new rds.DatabaseInstance(this, 'RdsInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0_21 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
      publiclyAccessible: true,
      iamAuthentication: true,
      databaseName: 'demo',
    });
    rdsInstance.connections.allowDefaultPortFromAnyIpv4();

    const lambdaRole = new iam.Role(this, 'LambdaIamRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
    );
    const rdsResourceId = '<resource id>';
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['rds-db:connect'],
        resources: [`arn:aws:rds-db:${this.region}:${this.account}:dbuser:${rdsResourceId}/user`],
      })
    );
    // rdsInstance.grantConnect(lambdaRole);

    const fn = new lambda.NodejsFunction(this, 'LambdaFunction', {
      entry: path.join(__dirname, '../src/index.js'),
      role: lambdaRole,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
      environment: {
        DB_HOSTNAME: rdsInstance.dbInstanceEndpointAddress,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // fn.currentVersion.addAlias('test', { provisionedConcurrentExecutions: 1 });

    const ec2Role = new iam.Role(this, 'Ec2IamRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    ec2Role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );
    ec2Role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy')
    );
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['rds-db:connect'],
        resources: [`arn:aws:rds-db:${this.region}:${this.account}:dbuser:${rdsResourceId}/user`],
      })
    );

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum install https://dev.mysql.com/get/mysql80-community-release-el7-3.noarch.rpm -y',
      'amazon-linux-extras install epel -y',
      'yum install mysql-community-client -y'
    );

    const ec2Instance = new ec2.Instance(this, 'LinuxEc2Instance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      role: ec2Role,
      keyName: 'security-tips',
    });

    new cdk.CfnOutput(this, 'EC2 Instance ID', { value: ec2Instance.instanceId });
    new cdk.CfnOutput(this, 'DB Host', { value: rdsInstance.dbInstanceEndpointAddress });
  }
}
