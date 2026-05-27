import { SHAREDSPACE_ROLE } from "src/common/constant/constants";
import { Chats } from "src/entities/Chats";
import { Images } from "src/entities/Images";
import { ProfileImages } from "src/entities/ProfileImages";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { Spaces } from "src/entities/Spaces";
import { Users } from "src/entities/Users";

export type TSharedspaceRole = typeof SHAREDSPACE_ROLE[keyof typeof SHAREDSPACE_ROLE];

export interface IErrorResponse {
  message: string,
  metaData?: {
    spaceUrl?: string,
    type?: string,
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
  UserId: string,
  exp: number,
};

export type TRefreshTokenPayload = {
  jti: string,
  UserId: string,
  exp: number,
};

export type TSharedspaceDefault = Pick<Spaces, 'createdAt'> & Pick<Sharedspaces, 'id' | 'name' | 'url' | 'private' | 'OwnerId'>;

export type TUserStandardType = Pick<Users, 'id' | 'email' | 'nickname' | 'provider' | 'status'> & {
  ProfileImage: string,
};

export type CacheItem<T> = {
  value: T,
  duration: number,
  expireTime: number,
};

export type TChatPayload = Pick<Chats,
  'id' |
  'content' |
  'SenderId' |
  'createdAt' |
  'updatedAt'> & {
    Sender: Pick<Users, 'email' | 'nickname'>,
    ChatImages: Array<Pick<Images, 'id' | 'path'>>,
    permission: {
      isSender: boolean,
    },
  }