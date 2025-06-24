import { applyDecorators, UseGuards } from "@nestjs/common";
import { RolesGuard } from "../guard/roles.guard";
import { JwtAuthGuard } from "src/auth/authGuard/jwt.auth.guard";

export function AuthRoleGuards() {
  return applyDecorators(
    UseGuards(JwtAuthGuard),
    UseGuards(RolesGuard)
  );
}