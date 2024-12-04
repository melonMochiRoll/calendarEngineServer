import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import ormconfig from 'ormconfig';
import { CacheManagerModule } from './cacheManager/cacheManager.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TodosModule } from './todos/todos.module';
import { SharedspacesModule } from './sharedspaces/sharedspaces.module';
import { JoinRequestsModule } from './joinRequests/joinRequests.module';
import { RolesModule } from './roles/roles.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ormconfig,
    }),
    CacheManagerModule,
    AuthModule,
    UsersModule,
    TodosModule,
    SharedspacesModule,
    JoinRequestsModule,
    RolesModule,
    EventsModule,
  ],
  controllers: [],
  providers: [],
})

export class AppModule {
  constructor(private dataSource: DataSource) {}
}