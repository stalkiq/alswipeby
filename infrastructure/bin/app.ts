#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AlswipebyStack } from '../lib/alswipeby-stack';

const app = new cdk.App();

new AlswipebyStack(app, 'AlswipebyStack', {
  env: {
    account: '016442247702',
    region: 'us-east-1',
  },
  description: 'Spreadsheet application infrastructure with DynamoDB, Lambda, and API Gateway',
});

app.synth();

