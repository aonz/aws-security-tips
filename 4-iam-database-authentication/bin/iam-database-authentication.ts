#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { IamDatabaseAuthenticationStack } from '../lib/iam-database-authentication-stack';

const app = new cdk.App();
new IamDatabaseAuthenticationStack(app, 'IamDatabaseAuthenticationStack', {});
