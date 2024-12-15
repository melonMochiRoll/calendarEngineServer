import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import 'dotenv/config';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspaceMembers } from 'src/entities/SharedspaceMembers';
import { Todos } from 'src/entities/Todos';
import { Users } from 'src/entities/Users';
import { JoinRequests } from 'src/entities/JoinRequests';
import { Roles } from 'src/entities/Roles';
import { Chats } from 'src/entities/Chats';
import { Images } from 'src/entities/Images';

const ormconfig: TypeOrmModuleOptions = {
  type: "mysql",
  host: "localhost",
  port: 3307,
  username: process.env.ORM_USERNAME,
  password: process.env.ORM_PASSWORD,
  database: process.env.ORM_DATABASE,
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
  synchronize: false,
  autoLoadEntities: true,
  charset: 'utf8mb4',
  logging: false,
}

export default ormconfig;