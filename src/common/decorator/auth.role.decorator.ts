import { applyDecorators, UseGuards } from "@nestjs/common";
import { IsAuthenicatedGuard } from "src/auth/authGuard/local.auth.guard";
import { RolesGuard } from "../guard/roles.guard";

export function AuthRoleGuards() {
  return applyDecorators(
    UseGuards(IsAuthenicatedGuard),
    UseGuards(RolesGuard)
  );
}