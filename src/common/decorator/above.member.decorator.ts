import { applyDecorators } from "@nestjs/common";
import { ESharedspaceMembersRoles } from "src/typings/types";
import { Roles } from 'src/common/decorator/roles.decorator';

export function AboveMemberRoles() {
  return applyDecorators(
    Roles([
      ESharedspaceMembersRoles.OWNER,
      ESharedspaceMembersRoles.MEMBER,
    ])
  );
}