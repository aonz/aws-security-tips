import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';

export class SsmSessionStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', { cidr: '10.0.0.0/16' });

    const role = new iam.Role(this, 'IamRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy')
    );

    const userData = ec2.UserData.forLinux();
    userData.addCommands('yum install -y nginx', 'chkconfig nginx on', 'service nginx start');

    new ec2.Instance(this, 'LinuxEc2Instance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      role,
      keyName: 'security-tips',
      userData,
    });

    new ec2.Instance(this, 'WindowsEc2Instance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
      machineImage: ec2.MachineImage.latestWindows(
        ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE
      ),
      role,
      keyName: 'security-tips',
    });
  }
}
