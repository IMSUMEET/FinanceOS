import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, Products } from "plaid";

export function getPlaidConfig() {
  const clientId = (process.env.PLAID_CLIENT_ID || "").replace(/^["']|["']$/g, "").trim();
  const secret = (process.env.PLAID_SECRET || "").replace(/^["']|["']$/g, "").trim();
  const rawEnv = (process.env.PLAID_ENV || "sandbox")
    .replace(/^["']|["']$/g, "")
    .trim()
    .toLowerCase();

  let plaidEnv = PlaidEnvironments.sandbox;
  if (rawEnv === "production") {
    plaidEnv = PlaidEnvironments.production;
  }

  const products: Products[] = (process.env.PLAID_PRODUCTS || "transactions")
    .split(",")
    .map((p) => p.trim() as Products);

  const countryCodes: CountryCode[] = (process.env.PLAID_COUNTRY_CODES || "US")
    .split(",")
    .map((c) => c.trim() as CountryCode);

  return {
    clientId,
    secret,
    env: rawEnv,
    plaidEnv,
    products,
    countryCodes,
    redirectUri: process.env.PLAID_REDIRECT_URI,
    webhookUrl: process.env.PLAID_WEBHOOK_URL,
    isConfigured: Boolean(clientId && secret),
  };
}

export function createPlaidClient(): PlaidApi {
  const config = getPlaidConfig();

  const configuration = new Configuration({
    basePath: config.plaidEnv,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": config.clientId,
        "PLAID-SECRET": config.secret,
      },
    },
  });

  return new PlaidApi(configuration);
}
