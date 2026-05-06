import Stripe from 'stripe';

function getEnv(name) {
  return String(process.env[name] || '').trim();
}

let stripeClient = null;

export function isStripeConfigured() {
  return Boolean(getEnv('STRIPE_SECRET_KEY'));
}

export function getStripeClient() {
  const apiKey = getEnv('STRIPE_SECRET_KEY');
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY is missing.');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(apiKey, {
      apiVersion: '2025-04-30.basil',
    });
  }
  return stripeClient;
}

export function getStripeWebhookSecret() {
  return getEnv('STRIPE_WEBHOOK_SECRET');
}
