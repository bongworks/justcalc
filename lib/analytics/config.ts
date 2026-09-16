export function getGaMeasurementId(environment = process.env.NODE_ENV, id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
  return environment === 'production' && id && /^G-[A-Z0-9]{4,20}$/.test(id) ? id : undefined;
}
