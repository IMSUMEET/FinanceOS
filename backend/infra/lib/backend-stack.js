const path = require("path");
const { Stack, Duration, CfnOutput, Fn, RemovalPolicy } = require("aws-cdk-lib");
const { Construct } = require("constructs");
const lambda = require("aws-cdk-lib/aws-lambda");
const { NodejsFunction, OutputFormat } = require("aws-cdk-lib/aws-lambda-nodejs");
const logs = require("aws-cdk-lib/aws-logs");
const apigwv2 = require("aws-cdk-lib/aws-apigatewayv2");
const { HttpLambdaIntegration } = require("aws-cdk-lib/aws-apigatewayv2-integrations");

class BackendStack extends Stack {
  /**
   * @param {Construct} scope
   * @param {string} id
   * @param {import('aws-cdk-lib').StackProps} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const backendRoot = path.join(__dirname, "..", "..");

    // Explicit log group avoids `logRetention` on Function, which deploys an extra
    // Lambda (custom resource). This stack must contain only one Lambda — the API.
    const apiLogGroup = new logs.LogGroup(this, "FinanceApiLogGroup", {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const apiFn = new NodejsFunction(this, "FinanceApiFunction", {
      entry: path.join(backendRoot, "src", "lambda.ts"),
      projectRoot: backendRoot,
      depsLockFilePath: path.join(backendRoot, "package-lock.json"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: Duration.seconds(15),
      logGroup: apiLogGroup,
      environment: {
        NODE_ENV: "production",
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: "node20",
        platform: "node",
        format: OutputFormat.CJS,
      },
    });

    const httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      description: "FinanceOS HTTP API (Hono Lambda)",
      corsPreflight: {
        allowHeaders: ["content-type", "authorization"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ["http://localhost:5173", "http://localhost:3000", "*"],
        maxAge: Duration.seconds(300),
      },
    });

    const integration = new HttpLambdaIntegration("LambdaIntegration", apiFn);

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

    new CfnOutput(this, "ApiUrl", {
      description: "Invoke URL for the $default stage (e.g. append /health)",
      value: httpApi.apiEndpoint,
      exportName: `${this.stackName}-ApiUrl`,
    });

    new CfnOutput(this, "HealthCheckExample", {
      description: "Example curl for /health",
      value: Fn.join("", ["curl ", httpApi.apiEndpoint, "/health"]),
    });
  }
}

module.exports = { BackendStack };
