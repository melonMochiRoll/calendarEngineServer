import { Roles } from "src/entities/Roles";
import { SharedspaceMembers } from "src/entities/SharedspaceMembers";
import { Sharedspaces } from "src/entities/Sharedspaces";
import { Users } from "src/entities/Users";

export type TUserData =
  Pick<Users, 'id' | 'email'> &
  {
    Sharedspacemembers: Array<
      Pick<SharedspaceMembers, 'RoleId'> & {
        Sharedspace: Pick<Sharedspaces, 'url' | 'private'>,
        Role: Pick<Roles, 'name'>
      }
    >,
  };

export const SharedspaceMembersRoles = {
  OWNER: 'owner',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

export type TSharedspaceMembersRole = typeof SharedspaceMembersRoles[keyof typeof SharedspaceMembersRoles];

export const SubscribedspacesSorts = {
  ALL: 'all',
  OWNED: 'owned',
  UNOWNED: 'unowned',
} as const;

export interface IErrorResponse {
  message: string,
  error: string,
  statusCode: number,
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

export const ProviderList = {
  LOCAL: 'local',
  NAVER: 'naver',
  GOOGLE: 'google',
} as const;

export const ChatsCommandList = {
  CHAT_CREATED: 'chat_created',
  CHAT_UPDATED: 'chat_updated',
  CHAT_DELETED: 'chat_deleted',
  CHAT_IMAGE_DELETED: 'chat_image_deleted',
} as const;

export type SharedspaceReturnMap<T> = T extends 'full' ? Sharedspaces :
  T extends 'standard' ? Pick<Sharedspaces, 'id' | 'name' | 'url' | 'private' | 'createdAt' | 'OwnerId'> :
  never;

export type UserReturnMap<T> = T extends 'full' ? Users :
  T extends 'standard' ? Pick<Users, 'id' | 'email' | 'provider' | 'profileImage'> :
  never;