import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Users } from './src/entities/Users';
import { Todos } from './src/entities/Todos';
import { Sharedspaces } from './src/entities/Sharedspaces';
import { Roles } from './src/entities/Roles';
import { JoinRequests } from './src/entities/JoinRequests';
import { SharedspaceMembers } from './src/entities/SharedspaceMembers';
import { Chats } from './src/entities/Chats';
import { Images } from './src/entities/Images';

const dbconfig: DataSourceOptions = {
  type: "mysql",
  host: process.env.DB_ORIGIN,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  charset: 'utf8mb4',
  logging: false,
  timezone: 'UTC',
};

export const ormconfig = {
  ...dbconfig,
  entities: [
    Users,
    Todos,
    Sharedspaces,
    Roles,
    JoinRequests,
    SharedspaceMembers,
    Chats,
    Images,
  ],
};

export default new DataSource({
  ...dbconfig,
  entities: ['src/entities/*.ts'],
  migrations: [__dirname + `/migrations/pending/*.{js,ts}`],
  migrationsTableName: 'migrations',
});