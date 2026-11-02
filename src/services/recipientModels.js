export const RecipientLookupStatus = Object.freeze({
  LOCAL_CACHE_MATCH: 'LOCAL_CACHE_MATCH',
  SERVER_DATABASE_MATCH: 'SERVER_DATABASE_MATCH',
  LIVE_UPI_VERIFIED: 'LIVE_UPI_VERIFIED',
  NOT_FOUND: 'NOT_FOUND',
  LOOKUP_UNAVAILABLE: 'LOOKUP_UNAVAILABLE',
});

export const RecipientDataSource = Object.freeze({
  LOCAL_DEVICE_CACHE: 'LOCAL_DEVICE_CACHE',
  APPLICATION_DATABASE: 'APPLICATION_DATABASE',
  AUTHORIZED_UPI_PROVIDER: 'AUTHORIZED_UPI_PROVIDER',
  NONE: 'NONE',
});

export const RecipientVerificationStatus = Object.freeze({
  NOT_VERIFIED: 'NOT_VERIFIED',
  LIVE_UPI_VERIFIED: 'LIVE_UPI_VERIFIED',
});

export function normalizeMobileNumber(input) {
  const digits = String(input || '').replace(/\D/g, '');
  const normalized = digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : digits.length === 11 && digits.startsWith('0')
      ? digits.slice(1)
      : digits;
  if (!/^\d{10}$/.test(normalized)) throw new Error('Enter a valid 10-digit mobile number.');
  return normalized;
}

