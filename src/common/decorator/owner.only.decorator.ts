import { applyDecorators } from "@nestjs/common";
import { Roles } from 'src/common/decorator/roles.decorator';
import { ESharedspaceMembersRoles } from "src/typings/types";

export function OwnerOnlyRoles() {
  return applyDecorators(
    Roles([ESharedspaceMembersRoles.OWNER])
  );
}