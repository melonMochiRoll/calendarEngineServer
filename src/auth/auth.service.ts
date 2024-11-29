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
    const request_url = 'https://accounts.google.com/o/oauth2/v2/auth';
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const state = nanoid(Number(process.env.SALT_OR_ROUNDS));
    const redirect_uri = 'http://localhost:3000/api/auth/login/oauth2/google/callback';
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];
    const scope = encodeURIComponent(scopes.join(' '));
    const prompt = 'select_account';

    session['state'] = state;
    return `${request_url}?client_id=${client_id}&response_type=code&state=${state}&redirect_uri=${redirect_uri}&scope=${scope}&prompt=${prompt}`;
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