import { SHAREDSPACE_ROLE } from "src/common/constant/constants";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { Users } from "src/entities/Users";

export type TSharedspaceRole = typeof SHAREDSPACE_ROLE[keyof typeof SHAREDSPACE_ROLE];

export interface IErrorResponse {
  message: string,
  metaData?: {
    spaceUrl?: string,
  },
};

export type TGoogleProfile = {
  id: string,
  displayName: string,
  name: { familyName: string | undefined, givenName: string },
  emails: Array<{ value: string, verified: boolean }>,
  photos: [
    {
      value: string
    }
  ],
  provider: string
  _raw: string,
  _json: {
    sub: string,
    name: string,
    given_name: string,
    picture: string,
    email: string,
    email_verified: boolean,
  }
};

export type TNaverProfile = {
  provider: string,
  id: string,
  displayName: string | undefined,
  emails: Array<{ value: string }>,
  _json: {
    email: string,
    nickname: string | undefined,
    profile_image: string,
    age: string | undefined,
    birthday: string | undefined,
    id: string,
  }
};

export type TAccessTokenPayload = {
  UserId: number,
  exp: number,
};

export type TRefreshTokenPayload = {
  jti: string,
  UserId: number,
  exp: number,
};

export type SharedspaceReturnMap<T> = T extends 'full' ? Sharedspaces :
  T extends 'standard' ? Pick<Sharedspaces, 'id' | 'name' | 'url' | 'private' | 'createdAt' | 'OwnerId'> :
  never;

export type UserReturnMap<T> = T extends 'full' ? Users :
  T extends 'standard' ? Pick<Users, 'id' | 'email' | 'nickname' | 'provider' | 'profileImage' | 'status'> :
  never;

export type CacheItem<T> = {
  value: T,
  duration: number,
  expireTime: number,
};