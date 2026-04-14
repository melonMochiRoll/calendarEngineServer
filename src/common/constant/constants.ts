
export const NANOID_SHAREDSPACE_URL_LENGTH = 9;

export const IMAGE_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  DELETED: 'deleted',
} as const;

export const INVITE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export const JOB_NAMES = {
  USER_DELETE: 'user_delete',
  SHAREDSPACE_DELETE: 'sharedspace_delete',
} as const;

export const JOB_STATUS = {
  PENDING: 'pending',
  PROCEEDING: 'proceeding',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;

export const CACHE_EMPTY_SYMBOL = '$$EMPTY$$';