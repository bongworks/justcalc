export interface AdSenseConfig {
  clientId: string;
}

const clientIdPattern = /^ca-pub-\d{10,24}$/;

/** Ads remain opt-in so a static build cannot accidentally enable them. */
export function getAdSenseConfig(
  environment = process.env.NODE_ENV,
  clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
): AdSenseConfig | undefined {
  if (environment !== 'production' || !clientId) return undefined;
  return clientIdPattern.test(clientId) ? { clientId } : undefined;
}
