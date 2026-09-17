export interface AdSenseConfig {
  clientId: string;
  resultSlotId: string;
}

const clientIdPattern = /^ca-pub-\d{10,24}$/;
const slotIdPattern = /^\d{10,24}$/;

/** Ads remain opt-in so a static build cannot accidentally enable them. */
export function getAdSenseConfig(
  environment = process.env.NODE_ENV,
  clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  resultSlotId = process.env.NEXT_PUBLIC_ADSENSE_RESULT_SLOT_ID,
): AdSenseConfig | undefined {
  if (environment !== 'production' || !clientId || !resultSlotId) return undefined;
  return clientIdPattern.test(clientId) && slotIdPattern.test(resultSlotId) ? { clientId, resultSlotId } : undefined;
}
