import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecrAssets from '@aws-cdk/aws-ecr-assets';
import * as ecs from '@aws-cdk/aws-ecs';
import * as kms from '@aws-cdk/aws-kms';
import * as iam from '@aws-cdk/aws-iam';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as ssm from '@aws-cdk/aws-ssm';

import * as path from 'path';

export class SensitiveDataStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', { cidr: '10.0.0.0/16' });

    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    const executionRole = new iam.Role(this, 'IamRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    executionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
    );
    executionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite')
    );
    executionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess')
    );

    const asset = new ecrAssets.DockerImageAsset(this, 'DockerImage', {
      repositoryName: 'sensitive-data',
      directory: path.join(__dirname, '../src'),
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', { executionRole });

    taskDefinition.addContainer('Container', {
      image: ecs.ContainerImage.fromDockerImageAsset(asset),
      memoryLimitMiB: 256,
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'SensitiveData' }),
      secrets: {
        PARAMETER_STORE: ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromSecureStringParameterAttributes(this, 'ParameterStore', {
            parameterName: 'SensitiveData',
            version: 1,
          })
        ),
        SECRETS_MANAGER: ecs.Secret.fromSecretsManager(
          secretsmanager.Secret.fromSecretNameV2(this, 'SecretsManager', 'SensitiveData')
        ),
      },
    });

    new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
      platformVersion: ecs.FargatePlatformVersion.VERSION1_3,
    });

    const key = new kms.Key(this, 'KmsKey');
    const alias = key.addAlias('alias/sensitive-data');

    new cdk.CfnOutput(this, 'KmsAlias', { value: alias.keyArn });
  }
}
