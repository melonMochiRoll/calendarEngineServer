import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ormconfig } from 'ormconfig';
import { CacheManagerModule } from './cacheManager/cacheManager.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TodosModule } from './todos/todos.module';
import { SharedspacesModule } from './sharedspaces/sharedspaces.module';
import { JoinRequestsModule } from './joinRequests/joinRequests.module';
import { RolesModule } from './roles/roles.module';
import { EventsModule } from './events/events.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import path from 'path';
import { ThrottlerModule } from '@nestjs/throttler';
import { AwsModule } from './aws/aws.module';
import { AppService } from './app.service';
import { Roles } from 'src/entities/Roles';
import { ChatsModule } from './chats/chats.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ormconfig,
    }),
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', ''),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 20,
      },
    ]),
    TypeOrmModule.forFeature([
      Roles,
    ]),
    CacheManagerModule,
    AuthModule,
    UsersModule,
    TodosModule,
    SharedspacesModule,
    JoinRequestsModule,
    RolesModule,
    EventsModule,
    AwsModule,
    ChatsModule,
  ],
  controllers: [],
  providers: [
    AppService,
  ],
})

export class AppModule {
  constructor(private dataSource: DataSource) {}
}