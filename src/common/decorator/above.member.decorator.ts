import { applyDecorators } from "@nestjs/common";
import { SharedspaceMembersRoles } from "src/typings/types";
import { Roles } from 'src/common/decorator/roles.decorator';

export function AboveMemberRoles() {
  return applyDecorators(
    Roles([
      SharedspaceMembersRoles.OWNER,
      SharedspaceMembersRoles.MEMBER,
    ])
  );
}