import { Injectable } from "@nestjs/common";
import bcrypt from 'bcrypt';
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "src/entities/Users";
import { Repository } from "typeorm";
import handleError from "src/common/function/handleError";
import { nanoid } from "nanoid";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  getGoogleAuthorizationUrl(session: Record<string, any>) {
    const state = nanoid(Number(process.env.SALT_OR_ROUNDS));
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    session['state'] = state;

    const request_url = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      response_type: 'code',
      state,
      redirect_uri: `${process.env.SERVER_ORIGIN}/api/auth/login/oauth2/google/callback`,
      scope: scopes.join(' '),
      prompt: 'select_account',
    }).toString();

    return `${request_url}?${params}`;
  }

  getNaverAuthorizationUrl(session: Record<string, any>) {
    const state = nanoid(Number(process.env.SALT_OR_ROUNDS));
    session['state'] = state;

    const request_url = 'https://nid.naver.com/oauth2.0/authorize';
    const params = new URLSearchParams({
      client_id: process.env.NAVER_CLIENT_ID,
      response_type: 'code',
      state,
      redirect_uri: `${process.env.SERVER_ORIGIN}/api/auth/login/oauth2/naver/callback`,
    }).toString();

    return `${request_url}?${params}`
  }

  async validateUser(
    email: string,
    password: string,
  ) {
    try {
      const user = await this.usersRepository.findOne({
        where: { email },
        select: ['id', 'email', 'password'],
      });
      const compare = await bcrypt.compare(password, user?.password || '');
  
      if (!user || !compare) {
        return null;
      }
  
      const { password: userPassword, ...rest } = user;
      return rest;
    } catch (err) {
      handleError(err);
    }
  }
}