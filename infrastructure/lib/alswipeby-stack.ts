import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
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
    // S3 Bucket for Backups
    // ==========================================
    const backupBucket = new s3.Bucket(this, 'BackupBucket', {
      bucketName: `alswipeby-backups-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldBackups',
          expiration: cdk.Duration.days(90), // Keep backups for 90 days
          enabled: true,
        },
      ],
    });

    // ==========================================
    // Lambda Function for Daily Backups
    // ==========================================
    const backupLambdaRole = new iam.Role(this, 'BackupLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant permissions for backup
    businessTable.grantReadData(backupLambdaRole);
    backupBucket.grantWrite(backupLambdaRole);
    backupLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:ExportTableToPointInTime',
          'dynamodb:DescribeExport',
        ],
        resources: [businessTable.tableArn],
      })
    );

    const backupLambda = new lambda.Function(this, 'BackupFunction', {
      functionName: 'alswipeby-daily-backup',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/daily-backup')),
      environment: {
        TABLE_NAME: businessTable.tableName,
        TABLE_ARN: businessTable.tableArn,
        BACKUP_BUCKET: backupBucket.bucketName,
      },
      timeout: cdk.Duration.minutes(15), // Export can take time
      memorySize: 512,
      role: backupLambdaRole,
    });

    // ==========================================
    // EventBridge Rule - Daily Backup at 2 AM UTC
    // ==========================================
    const backupRule = new events.Rule(this, 'DailyBackupRule', {
      schedule: events.Schedule.cron({ hour: '2', minute: '0' }), // 2 AM UTC daily
      description: 'Daily backup of DynamoDB table',
    });

    backupRule.addTarget(new targets.LambdaFunction(backupLambda));

    // ==========================================
    // CloudWatch Alarms
    // ==========================================
    
    // Alarm for high API usage
    const apiAlarm = new cloudwatch.Alarm(this, 'HighAPIUsageAlarm', {
      alarmName: 'AlswipebyHighAPIUsage',
      alarmDescription: 'Alert when API Gateway receives more than 1000 requests per hour',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Count',
        dimensionsMap: {
          ApiName: api.restApiName,
        },
        period: cdk.Duration.hours(1),
        statistic: 'Sum',
      }),
      threshold: 1000,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Alarm for Lambda errors - Get function
    const lambdaErrorAlarmGet = new cloudwatch.Alarm(this, 'LambdaErrorAlarmGet', {
      alarmName: 'AlswipebyLambdaErrorsGet',
      alarmDescription: 'Alert when GET Lambda function has errors',
      metric: getBusinessDataLambda.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Alarm for Lambda errors - Save function
    const lambdaErrorAlarmSave = new cloudwatch.Alarm(this, 'LambdaErrorAlarmSave', {
      alarmName: 'AlswipebyLambdaErrorsSave',
      alarmDescription: 'Alert when SAVE Lambda function has errors',
      metric: saveBusinessDataLambda.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Alarm for DynamoDB throttling
    const dynamoThrottleAlarm = new cloudwatch.Alarm(this, 'DynamoThrottleAlarm', {
      alarmName: 'AlswipebyDynamoThrottling',
      alarmDescription: 'Alert when DynamoDB is throttling requests',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/DynamoDB',
        metricName: 'ThrottledRequests',
        dimensionsMap: {
          TableName: businessTable.tableName,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // ==========================================
    // Route 53 Hosted Zone for Custom Domain
    // ==========================================
    const domainName = 'alswipeby.com';
    
    // If hosted zone already exists, use: route53.HostedZone.fromLookup(this, 'HostedZone', { domainName })
    // Otherwise, this will create a new hosted zone
    // Note: Domain must be registered first (via Route 53 or external registrar)
    const hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: domainName,
      comment: 'Hosted zone for alswipeby.com',
    });

    // ==========================================
    // SSL Certificate for Custom Domain
    // ==========================================
    // Certificate must be in us-east-1 for CloudFront
    const certificate = new certificatemanager.Certificate(this, 'DomainCertificate', {
      domainName: domainName,
      subjectAlternativeNames: [`www.${domainName}`], // Also cover www.alswipeby.com
      validation: certificatemanager.CertificateValidation.fromDns(hostedZone),
    });

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
      domainNames: [domainName, `www.${domainName}`], // Support both alswipeby.com and www.alswipeby.com
      certificate: certificate,
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
    // Route 53 Records for Custom Domain
    // ==========================================
    // A record for alswipeby.com
    new route53.ARecord(this, 'DomainARecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
    });

    // AAAA record for IPv6 support
    new route53.AaaaRecord(this, 'DomainAaaaRecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
    });

    // A record for www.alswipeby.com
    new route53.ARecord(this, 'WwwDomainARecord', {
      zone: hostedZone,
      recordName: `www.${domainName}`,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
    });

    // AAAA record for www.alswipeby.com IPv6 support
    new route53.AaaaRecord(this, 'WwwDomainAaaaRecord', {
      zone: hostedZone,
      recordName: `www.${domainName}`,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
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

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: backupBucket.bucketName,
      description: 'S3 bucket for automated backups',
      exportName: 'AlswipebyBackupBucket',
    });

    new cdk.CfnOutput(this, 'BackupLambdaFunctionName', {
      value: backupLambda.functionName,
      description: 'Lambda function that performs daily backups',
      exportName: 'AlswipebyBackupFunction',
    });

    new cdk.CfnOutput(this, 'CustomDomainName', {
      value: domainName,
      description: 'Custom domain name for the website',
      exportName: 'AlswipebyDomainName',
    });

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
      exportName: 'AlswipebyHostedZoneId',
    });

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: certificate.certificateArn,
      description: 'ACM Certificate ARN for the custom domain',
      exportName: 'AlswipebyCertificateArn',
    });
  }
}

