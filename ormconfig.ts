import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import 'dotenv/config';
import { Sharedspaces } from 'src/entities/Sharedspaces';
import { SharedspaceMembers } from 'src/entities/SharedspacesMembers';
import { Todos } from 'src/entities/Todos';
import { Users } from 'src/entities/Users';

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
    SharedspaceMembers,
  ],
  synchronize: false,
  autoLoadEntities: true,
  charset: 'utf8mb4',
}

export default ormconfig;