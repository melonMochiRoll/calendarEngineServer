
export const SHAREDSPACE_URL_LENGTH = 12;

export const REFRESH_TOKEN_JTI_LENGTH = 20;

export const USER_PROVIDER = {
  LOCAL: 'local',
  NAVER: 'naver',
  GOOGLE: 'google',
} as const;

export const SHAREDSPACE_ROLE = {
  OWNER: 'owner',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

export const SUBSCRIBEDSPACES_SORT = {
  ALL: 'all',
  OWNED: 'owned',
  UNOWNED: 'unowned',
} as const;

export const IMAGE_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  DELETED: 'deleted',
} as const;

export const INVITE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELED: 'canceled',
} as const;

export const JOINREQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export const USER_STATUS = {
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

export const ChatToServer = {
  JOIN_SHAREDSPACE_ROOM: 'join_sharedspace_room',
  LEAVE_SHAREDSPACE_ROOM: 'leave_sharedspace_room',
  SEND_SHAREDSPACE_CHAT: 'send_sharedspace_chat',
  UPDATE_SHAREDSPACE_CHAT: 'update_sharedspace_chat',
  DELETE_SHAREDSPACE_CHAT: 'delete_sharedspace_chat',
  DELETE_SHAREDSPACE_CHAT_IMAGE: 'delete_sharedspace_chat_image',
} as const;

export const ChatToClient = {
  SHAREDSPACE_CHAT_CREATED: 'sharedspace_chat_created',
  SHAREDSPACE_CHAT_UPDATED: 'sharedspace_chat_updated',
  SHAREDSPACE_CHAT_DELETED: 'sharedspace_chat_deleted',
  SHAREDSPACE_CHAT_IMAGE_DELETED: 'sharedspace_chat_image_deleted',
  SHAREDSPACE_CHAT_ERROR: 'sharedspace_chat_error',
} as const;

export const ChatAckStatus = {
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export const CACHE_EMPTY_SYMBOL = '$$EMPTY$$';