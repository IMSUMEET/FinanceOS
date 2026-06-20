#!/usr/bin/env node
const cdk = require("aws-cdk-lib");
const { BackendStack } = require("../lib/backend-stack");
const { FinanceOsAiCsvAnalyzerStack } = require("../lib/ai-analyzer-stack");

const app = new cdk.App();

// Omit `env` so account/region come from your default AWS credentials
// (`aws configure` / profile). Set CDK_DEFAULT_ACCOUNT / CDK_DEFAULT_REGION only if you need to pin them.
// Construct id `FileProcessing` → synth artifact `cdk.out/FileProcessing.template.json`.
// CloudFormation stack name cannot contain spaces; `File-Processing` is the deployed stack name.
new BackendStack(app, "FileProcessing", {
  stackName: "File-Processing",
  description: "File Processing — FinanceOS CSV API (Lambda + HTTP API)",
});

new FinanceOsAiCsvAnalyzerStack(app, "FinanceOsAiCsvAnalyzerStack", {
  stackName: "FinanceOsAiCsvAnalyzerStack",
  description: "AI CSV Analyzer Stack — Personal Finance AI Categorizer and Insights",
});
