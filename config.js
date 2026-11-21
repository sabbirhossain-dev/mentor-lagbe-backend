import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI,
  authUrl: process.env.AUTH_URL || "http://localhost:3000",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
};

export function validateConfig() {
  const missing = [];
  if (!config.mongodbUri) missing.push("MONGODB_URI");
  if (!config.stripeSecretKey) missing.push("STRIPE_SECRET_KEY");

  if (missing.length > 0) {
    console.warn(`[Config Warning] Missing environment variables: ${missing.join(", ")}`);
  }
}
