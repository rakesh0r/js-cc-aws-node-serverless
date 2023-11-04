import type { AWS } from '@serverless/typescript';

import importProductsFile from "@functions/importProductsFile";
import importFileParser from "@functions/importFileParser";

const serverlessConfiguration: AWS = {
  service: 'import-service',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    stage: "dev",
    region: "us-east-1",
    httpApi: {
      authorizers: {
        customAuthorizer: {
          name: 'customAuthorizer',
          type: 'request',
          functionArn: 'arn:aws:lambda:${self:provider.region}:${aws:accountId}:function:authorization-service-dev-basicAuthorizer',
          payloadVersion:'2.0',
          enableSimpleResponses: true,
        }
      }
    },
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      REGION: "us-east-1",
      STAGE: "dev",
      BUCKET: "cloudx-aws-shop",
      SQS_URL: "https://sqs.us-east-1.amazonaws.com/${aws:accountId}/catalogItemsQueue"
    },
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["s3:ListBucket"],
            Resource: "arn:aws:s3:::cloudx-aws-shop",
          },
          {
            Effect: "Allow",
            Action: ["s3:*"],
            Resource: "arn:aws:s3:::cloudx-aws-shop/*",
          },
          {
            Effect: "Allow",
            Action: ["sqs:SendMessage"],
            Resource: "arn:aws:sqs:us-east-1:*:catalogItemsQueue",
          },
        ],
      },
    },
  },
  // import the function via paths
  functions: { importProductsFile, importFileParser },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
