#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SensitiveDataStack } from '../lib/sensitive-data-stack';

const app = new cdk.App();
new SensitiveDataStack(app, 'SensitiveDataStack', {});
