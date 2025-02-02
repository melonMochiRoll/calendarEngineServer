import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { CacheManagerService } from "src/cacheManager/cacheManager.service";
import { INTERNAL_SERVER_MESSAGE } from "src/common/constant/error.message";
import { RedirectingException } from "src/common/exception/redirecting.exception";

@Injectable()
export class OAuth2CSRFGuard implements CanActivate {
  constructor(
    private cacheManagerService: CacheManagerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const state = await this.cacheManagerService.getGuestCache(request.query?.state);

    if (!state) {
      throw new RedirectingException(`${process.env.PRODUCTION_SERVER_ORIGIN}/login?error=${INTERNAL_SERVER_MESSAGE}`);
    }

    return true;
  }
} 