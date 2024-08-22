import { Users } from "src/entities/Users";

export type CreateUserDTO = Pick<Users, 'email' | 'password'>;