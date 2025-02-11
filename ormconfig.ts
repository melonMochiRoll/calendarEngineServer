import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { Todos } from 'src/entities/Todos';
import { Users } from 'src/entities/Users';
import { JoinRequests } from 'src/entities/JoinRequests';
import { Roles } from 'src/entities/Roles';
import { Chats } from 'src/entities/Chats';
import { Images } from 'src/entities/Images';

export const ormconfig = new DataSource({
  type: "mysql",
  host: process.env.DB_ORIGIN,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  /** entities: [
    Users,
    Todos,
    Sharedspaces,
    Roles,
    JoinRequests,
    SharedspaceMembers,
    Chats,
    Images,
  ], */
  entities: ['src/entities/*.ts'],
  migrations: ['migrations/*.ts'],
  synchronize: false,
  // autoLoadEntities: true,
  charset: 'utf8mb4',
  logging: false,
});
