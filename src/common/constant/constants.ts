
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

export const CACHE_EMPTY_SYMBOL = '$$EMPTY$$';