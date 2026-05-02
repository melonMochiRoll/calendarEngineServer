import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import bcrypt from 'bcrypt';
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/Users";
import { DataSource, Repository } from "typeorm";
import { nanoid } from "nanoid";
import { Response } from "express";
import { RefreshTokens } from "src/entities/RefreshTokens";
import dayjs from "dayjs";
import { JwtService } from "@nestjs/jwt";
import { ACCESS_TOKEN_COOKIE_NAME, CSRF_TOKEN_COOKIE_NAME, OAUTH2_CSRF_STATE_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from "src/common/constant/auth.constants";
import { REFRESH_TOKEN_JTI_LENGTH, USER_STATUS } from "src/common/constant/constants";
import { TRefreshTokenPayload } from "src/typings/types";
import { NOT_FOUND_USER, TOKEN_EXPIRED } from "src/common/constant/error.message";
import { UsersService } from "src/users/users.service";

const isDevelopment = process.env.NODE_ENV === 'development';

@Injectable()
export class AuthService {
  constructor(
    private dataSource: DataSource,
    private jwtService: JwtService,
    private usersService: UsersService,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(RefreshTokens)
    private refreshTokensRepository: Repository<RefreshTokens>,
  ) {}

  private readonly tokenCookieOption = {
    httpOnly: true,
    sameSite: 'strict',
    secure: !isDevelopment,
  } as const;

  async jwtLogin(UserId: string) {
    const qr = this.dataSource.createQueryRunner();

    const accessTokenExpires = dayjs().add(15, 'minute');
    const refreshTokenExpires = dayjs().add(7, 'day');
    const jti = nanoid(REFRESH_TOKEN_JTI_LENGTH);

    const accessToken = this.jwtService.sign({
      UserId,
      exp: accessTokenExpires.unix(),
    });

    const refreshToken = this.jwtService.sign({
      jti,
      UserId,
      exp: refreshTokenExpires.unix(),
    });

    await qr.connect();
    await qr.startTransaction();

    try {
      await qr.manager.delete(RefreshTokens, { UserId });

      await qr.manager.save(RefreshTokens, {
        jti,
        UserId,
        expiresAt: refreshTokenExpires.toDate(),
      });

      await qr.commitTransaction();

      return {
        accessToken: {
          name: ACCESS_TOKEN_COOKIE_NAME,
          token: accessToken,
          option: this.tokenCookieOption,
        },
        refreshToken: {
          name: REFRESH_TOKEN_COOKIE_NAME,
          token: refreshToken,
          option: this.tokenCookieOption,
        },
      }
    } catch (err) {
      await qr.rollbackTransaction();

      throw err;
    } finally {
      await qr.release();
    }
  }

  async getGoogleAuthorizationUrl() {
    const scope = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');

    const state = nanoid(+process.env.SALT_OR_ROUNDS);

    const request_url = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      response_type: 'code',
      state,
      redirect_uri: `${process.env.SERVER_ORIGIN}/api/auth/login/oauth2/google/callback`,
      scope,
      prompt: 'select_account',
    }).toString();

    return {
      name: OAUTH2_CSRF_STATE_COOKIE_NAME,
      value: state,
      option: {
        httpOnly: true,
        sameSite: 'lax',
        secure: !isDevelopment,
      } as const,
      url: `${request_url}?${params}`,
    };
  }

  async getNaverAuthorizationUrl(response: Response) {
    const state = nanoid(+process.env.SALT_OR_ROUNDS);

    const request_url = 'https://nid.naver.com/oauth2.0/authorize';
    const params = new URLSearchParams({
      client_id: process.env.NAVER_CLIENT_ID,
      response_type: 'code',
      state,
      redirect_uri: `${process.env.SERVER_ORIGIN}/api/auth/login/oauth2/naver/callback`,
    }).toString();

    return {
      name: OAUTH2_CSRF_STATE_COOKIE_NAME,
      value: state,
      option: {
        httpOnly: true,
        sameSite: 'lax',
        secure: !isDevelopment,
      } as const,
      url: `${request_url}?${params}`,
    };
  }

  async validateUser(
    email: string,
    password: string,
  ) {
    const user = await this.usersRepository.findOne({
      select: {
        id: true,
        email: true,
        nickname: true,
        password: true,
        profileImage: true,
        status: true,
      },
      where: {
        email,
      },
    });

    if (!user) {
      return false;
    }

    const compare = await bcrypt.compare(password, user.password);

    if (!compare) {
      return false;
    }

    const { password: _, ...withoutPassword } = user;
    return withoutPassword;
  }

  async logout(UserId: string) {
    await this.refreshTokensRepository.delete({ UserId });

    return [
      { name: ACCESS_TOKEN_COOKIE_NAME, option: this.tokenCookieOption },
      { name: REFRESH_TOKEN_COOKIE_NAME, option: this.tokenCookieOption },
      { name: CSRF_TOKEN_COOKIE_NAME, option: this.tokenCookieOption },
    ];
  }

  getCsrfToken() {
    return {
      name: CSRF_TOKEN_COOKIE_NAME,
      csrfToken: nanoid(+process.env.CSRF_TOKEN_SIZE),
      option: this.tokenCookieOption,
    };
  }

  async refreshAuthToken(refreshToken: string) {
    const now = dayjs();

    if (!refreshToken) {
      throw new UnauthorizedException(TOKEN_EXPIRED);
    }

    const refreshTokenPayload = await this.jwtService.verifyAsync<TRefreshTokenPayload>(refreshToken, {
      secret: process.env.JWT_SECRET,
      ignoreExpiration: true,
    });

    if (now.isSameOrAfter(dayjs(refreshTokenPayload.exp, 'X'))) {
      throw new UnauthorizedException(TOKEN_EXPIRED);
    }

    const refreshTokenData = await this.refreshTokensRepository.findOne({
      where: {
        jti: refreshTokenPayload.jti,
        UserId: refreshTokenPayload.UserId,
      },
    });

    if (
      !refreshTokenData ||
      (refreshTokenData.revokedAt && now.isSameOrAfter(dayjs(refreshTokenData.revokedAt)))
    ) {
      throw new UnauthorizedException(TOKEN_EXPIRED);
    }

    const user = await this.usersService.getUserById(refreshTokenPayload.UserId);

    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw new BadRequestException(NOT_FOUND_USER);
    }

    return await this.jwtLogin(user.id);
  }
}