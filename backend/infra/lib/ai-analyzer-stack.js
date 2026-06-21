const path = require("path");
const { Stack, Duration, CfnOutput, Fn, RemovalPolicy } = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const { NodejsFunction, OutputFormat } = require("aws-cdk-lib/aws-lambda-nodejs");
const logs = require("aws-cdk-lib/aws-logs");
const apigwv2 = require("aws-cdk-lib/aws-apigatewayv2");
const { HttpLambdaIntegration } = require("aws-cdk-lib/aws-apigatewayv2-integrations");

class FinanceOsAiCsvAnalyzerStack extends Stack {
  /**
   * @param {import('constructs').Construct} scope
   * @param {string} id
   * @param {import('aws-cdk-lib').StackProps} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const backendRoot = path.join(__dirname, "..", "..");

    // Explicit log group to control retention
    const logGroup = new logs.LogGroup(this, "FinanceAiAnalyzerLogGroup", {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const aiFn = new NodejsFunction(this, "FinanceAiAnalyzerFunction", {
      entry: path.join(backendRoot, "src", "aiAnalyzer.ts"),
      projectRoot: backendRoot,
      depsLockFilePath: path.join(backendRoot, "package-lock.json"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: Duration.seconds(60), // Lambda 2 requires 60 seconds timeout
      logGroup,
      environment: {
        NODE_ENV: "production",
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
        OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "openrouter/free",
        APP_URL: process.env.APP_URL || "https://financeos.app",
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: "node20",
        platform: "node",
        format: OutputFormat.CJS,
      },
    });

    // Expose Lambda over HTTP API Gateway (avoiding direct Function URL NONE auth block policies)
    const httpApi = new apigwv2.HttpApi(this, "AiAnalyzerHttpApi", {
      description: "FinanceOS AI CSV Analyzer HTTP API Gateway",
      corsPreflight: {
        allowHeaders: ["content-type", "authorization", "accept"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ["*"],
        maxAge: Duration.seconds(300),
      },
    });

    const integration = new HttpLambdaIntegration("AiLambdaIntegration", aiFn);

    httpApi.addRoutes({
      path: "/",
      methods: [apigwv2.HttpMethod.ANY],
      integration,
    });

    httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [apigwv2.HttpMethod.ANY],
      integration,
    });

    new CfnOutput(this, "AiAnalyzerUrl", {
      description: "Endpoint URL for the AI CSV Analyzer HTTP API (POST / or /api/ai-analyze)",
      value: httpApi.apiEndpoint,
    });
  }
}

module.exports = { FinanceOsAiCsvAnalyzerStack };
