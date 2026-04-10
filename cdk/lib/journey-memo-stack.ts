import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import * as path from 'path'

export class JourneyMemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // DynamoDB テーブル
    const table = new dynamodb.Table(this, 'TravelsTable', {
      tableName: 'journey-memo-travels',
      partitionKey: { name: 'prefectureCode', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    // 写真用 S3 バケット
    const photoBucket = new s3.Bucket(this, 'PhotoBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    })

    const lambdaEnv = {
      TABLE_NAME: table.tableName,
      JWT_SECRET: 'journey-memo-secret-change-in-production',
      PHOTO_BUCKET: photoBucket.bucketName,
    }

    // Auth Lambda
    const authFn = new NodejsFunction(this, 'AuthFunction', {
      entry: path.join(__dirname, '../../backend/src/auth.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_24_X,
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(10),
      bundling: {
        minify: true,
        sourceMap: false,
      },
    })

    // Travels Lambda
    const travelsFn = new NodejsFunction(this, 'TravelsFunction', {
      entry: path.join(__dirname, '../../backend/src/travels.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_24_X,
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(10),
      bundling: {
        minify: true,
        sourceMap: false,
      },
    })

    // Photos Lambda
    const photosFn = new NodejsFunction(this, 'PhotosFunction', {
      entry: path.join(__dirname, '../../backend/src/photos.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_24_X,
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(15),
      bundling: {
        minify: true,
        sourceMap: false,
      },
    })

    table.grantReadWriteData(travelsFn)
    photoBucket.grantPut(photosFn)
    photoBucket.grantDelete(photosFn)

    // API Gateway
    const api = new apigateway.RestApi(this, 'JourneyMemoApi', {
      restApiName: 'journey-memo-api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    })

    const authResource = api.root.addResource('auth')
    authResource.addMethod('POST', new apigateway.LambdaIntegration(authFn))

    const travelsResource = api.root.addResource('travels')
    travelsResource.addMethod('GET', new apigateway.LambdaIntegration(travelsFn))

    const prefectureResource = travelsResource.addResource('{prefectureCode}')
    prefectureResource.addMethod('GET', new apigateway.LambdaIntegration(travelsFn))
    prefectureResource.addMethod('PUT', new apigateway.LambdaIntegration(travelsFn))

    const photosResource = api.root.addResource('photos')
    photosResource.addMethod('POST', new apigateway.LambdaIntegration(photosFn))
    photosResource.addMethod('DELETE', new apigateway.LambdaIntegration(photosFn))

    // CloudFront Function: /api/* → /* にパスを書き換え
    const apiRewriteFn = new cloudfront.Function(this, 'ApiRewriteFunction', {
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  request.uri = request.uri.replace(/^\\/api/, '') || '/';
  return request;
}
      `),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
    })

    // S3 バケット (フロントエンド)
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    // CloudFront OAC (フロントエンド)
    const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      signing: cloudfront.Signing.SIGV4_NO_OVERRIDE,
    })

    // CloudFront OAC (写真)
    const photoOac = new cloudfront.S3OriginAccessControl(this, 'PhotoOAC', {
      signing: cloudfront.Signing.SIGV4_NO_OVERRIDE,
    })

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket, {
          originAccessControl: oac,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(`${api.restApiId}.execute-api.${this.region}.amazonaws.com`, {
            originPath: `/${api.deploymentStage.stageName}`,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          functionAssociations: [
            {
              function: apiRewriteFn,
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
        },
        '/photos/*': {
          origin: origins.S3BucketOrigin.withOriginAccessControl(photoBucket, {
            originAccessControl: photoOac,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    })

    // フロントエンドのデプロイ
    new s3deploy.BucketDeployment(this, 'WebsiteDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../frontend/dist'))],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    })

    // Outputs
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'アプリケーションURL',
    })

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API エンドポイント',
    })

    new cdk.CfnOutput(this, 'PhotoBucketName', {
      value: photoBucket.bucketName,
      description: '写真保存用S3バケット',
    })
  }
}
