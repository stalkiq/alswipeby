import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class AlswipebyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ==========================================
    // DynamoDB Table
    // ==========================================
    const businessTable = new dynamodb.Table(this, 'BusinessDataTable', {
      tableName: 'AlswipebyBusinessData-v2',
      partitionKey: {
        name: 'docId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand pricing
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep data on stack deletion
      pointInTimeRecovery: true, // Enable backups
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add Global Secondary Index for querying by timestamp
    businessTable.addGlobalSecondaryIndex({
      indexName: 'CreatedAtIndex',
      partitionKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ==========================================
    // Lambda Functions
    // ==========================================
    
    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB permissions
    businessTable.grantReadWriteData(lambdaRole);

    // GET Lambda - Fetch all business data
    const getBusinessDataLambda = new lambda.Function(this, 'GetBusinessDataFunction', {
      functionName: 'alswipeby-get-business-data',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/get-business-data')),
      environment: {
        TABLE_NAME: businessTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      role: lambdaRole,
    });

    // POST Lambda - Save business data
    const saveBusinessDataLambda = new lambda.Function(this, 'SaveBusinessDataFunction', {
      functionName: 'alswipeby-save-business-data',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/save-business-data')),
      environment: {
        TABLE_NAME: businessTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      role: lambdaRole,
    });

    // ==========================================
    // API Gateway
    // ==========================================
    const api = new apigateway.RestApi(this, 'BusinessDataApi', {
      restApiName: 'Alswipeby Business Data API',
      description: 'API for managing business spreadsheet data',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // In production, restrict this
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
      deployOptions: {
        stageName: 'prod',
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
        metricsEnabled: true,
      },
    });

    // API Resources and Methods
    const businesses = api.root.addResource('businesses');
    
    // GET /businesses
    businesses.addMethod('GET', new apigateway.LambdaIntegration(getBusinessDataLambda, {
      proxy: true,
    }));

    // POST /businesses/save
    const save = businesses.addResource('save');
    save.addMethod('POST', new apigateway.LambdaIntegration(saveBusinessDataLambda, {
      proxy: true,
    }));

    // ==========================================
    // S3 Bucket for Next.js Static Assets
    // ==========================================
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `alswipeby-website-v2-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
    });

    // Origin Access Identity for CloudFront
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: 'OAI for Alswipeby website',
    });

    websiteBucket.grantRead(originAccessIdentity);

    // ==========================================
    // CloudFront Distribution
    // ==========================================
    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe
      enabled: true,
      comment: 'Alswipeby spreadsheet application',
    });

    // ==========================================
    // Outputs
    // ==========================================
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: businessTable.tableName,
      description: 'DynamoDB table name',
      exportName: 'AlswipebyTableName',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: 'AlswipebyApiUrl',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 bucket for website hosting',
      exportName: 'AlswipebyBucketName',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain',
      exportName: 'AlswiepbyDistributionDomain',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: 'AlswipebyDistributionId',
    });
  }
}

