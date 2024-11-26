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

export const SubscribedspacesFilter = {
  ALL: 'all',
  OWNED: 'owned',
  UNOWNED: 'unowned',
} as const;

export type TSubscribedspacesFilter = typeof SubscribedspacesFilter[keyof typeof SubscribedspacesFilter];

export interface IErrorResponse {
  message: string,
  error: string,
  statusCode: number,
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

export const ProviderList = {
  LOCAL: 'local',
  NAVER: 'naver',
} as const;