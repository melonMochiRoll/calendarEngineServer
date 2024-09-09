import { applyDecorators, UseGuards } from "@nestjs/common";
import { IsAuthenicatedGuard } from "src/auth/local.auth.guard";
import { RolesGuard } from "../guard/roles.guard";

export function AuthRoleGuards() {
  return applyDecorators(
    UseGuards(IsAuthenicatedGuard),
    UseGuards(RolesGuard)
  );
}