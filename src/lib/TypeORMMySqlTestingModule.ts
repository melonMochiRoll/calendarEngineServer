import { TypeOrmModule } from '@nestjs/typeorm';

export const TypeORMMySqlTestingModule = (entities: any[]) =>
  TypeOrmModule.forRoot({
    type: 'mysql',
    host: process.env.DEV_DB_ORIGIN,
    port: +process.env.DEV_DB_PORT,
    username: process.env.DEV_DB_USERNAME,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_DATABASE,
    entities: [...entities],
    synchronize: true,
    dropSchema: true,
    autoLoadEntities: true,
    charset: 'utf8mb4',
    timezone: '+00:00',
  });