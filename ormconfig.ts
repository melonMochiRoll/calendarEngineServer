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
  host: process.env.AWS_RDS_ORIGIN,
  port: +process.env.AWS_RDS_PORT,
  username: process.env.AWS_RDS_USERNAME,
  password: process.env.AWS_RDS_PASSWORD,
  database: process.env.AWS_RDS_DATABASE,
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