#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { JourneyMemoStack } from '../lib/journey-memo-stack'

const app = new cdk.App()
new JourneyMemoStack(app, 'JourneyMemoStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
  },
})
