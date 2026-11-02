import { recipientApiService } from './recipientApiService';
import { recipientCacheRepository } from './recipientCacheRepository';
import { normalizeMobileNumber, RecipientDataSource, RecipientLookupStatus, RecipientVerificationStatus } from './recipientModels';

function serverMatch(response) {
  if (response?.status !== RecipientLookupStatus.SERVER_DATABASE_MATCH ||
      response?.source !== RecipientDataSource.APPLICATION_DATABASE ||
      response?.verificationStatus !== RecipientVerificationStatus.NOT_VERIFIED ||
      !response?.recipient?.id || !response?.recipient?.displayName) {
    throw new Error('Recipient lookup returned an invalid or unsupported result.');
  }
  return { ...response, isStale:false, liveVerified:false, lastSyncedAt:response.checkedAt };
}

function validateSnapshot(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.records) || !snapshot.syncedAt || snapshot.liveVerificationAvailable !== false) {
    throw new Error('Recipient synchronization returned an invalid snapshot.');
  }
  for (const record of snapshot.records) {
    if (!record?.recipientId || !record?.displayName || !record?.mobileNumber ||
        record?.status !== RecipientLookupStatus.SERVER_DATABASE_MATCH ||
        record?.source !== RecipientDataSource.APPLICATION_DATABASE ||
        record?.verificationStatus !== RecipientVerificationStatus.NOT_VERIFIED) {
      throw new Error('Recipient synchronization included an invalid record.');
    }
  }
}

export const recipientLookupService = {
  async lookup(ownerId, input) {
    const mobileNumber = normalizeMobileNumber(input);
    try {
      const response = await recipientApiService.lookup(mobileNumber);
      if (response?.status === RecipientLookupStatus.NOT_FOUND &&
          response?.verificationStatus === RecipientVerificationStatus.NOT_VERIFIED) {
        return { ...response, recipient:null, isStale:false, liveVerified:false };
      }
      if (response?.status === RecipientLookupStatus.SERVER_DATABASE_MATCH) return serverMatch(response);
      if (response?.status === RecipientLookupStatus.LIVE_UPI_VERIFIED) {
        throw new Error('No authorized live UPI verification provider is configured.');
      }
      throw new Error('Recipient service returned an unsupported status.');
    } catch (remoteError) {
      try {
        const cached = await recipientCacheRepository.findByMobile(ownerId, mobileNumber);
        if (cached) return { ...cached, remoteUnavailable:true };
      } catch {
        // A cache read failure must never be presented as a successful lookup.
      }
      if (remoteError?.message === 'Enter a valid 10-digit mobile number.') throw remoteError;
      return {
        status:RecipientLookupStatus.LOOKUP_UNAVAILABLE,
        source:RecipientDataSource.NONE,
        verificationStatus:RecipientVerificationStatus.NOT_VERIFIED,
        recipient:null,
        isStale:false,
        liveVerified:false,
        message:'The recipient service is unavailable and there is no saved recipient on this device.',
      };
    }
  },

  async saveForOffline(ownerId, recipientId) {
    const record = await recipientApiService.save(recipientId);
    if (record?.verificationStatus !== RecipientVerificationStatus.NOT_VERIFIED || !record?.mobileNumber) {
      throw new Error('Recipient service returned an invalid save response.');
    }
    try {
      await recipientCacheRepository.save(ownerId, record);
      return { saved:true, cached:true };
    } catch {
      return { saved:true, cached:false };
    }
  },

  async sync(ownerId) {
    const snapshot = await recipientApiService.sync();
    validateSnapshot(snapshot);
    return recipientCacheRepository.replaceOwnerSnapshot(ownerId, snapshot.records, snapshot.syncedAt);
  },

  async getDiscoverability() {
    return recipientApiService.getDiscoverability();
  },

  async setDiscoverability(enabled) {
    return recipientApiService.setDiscoverability(enabled);
  },
};

