import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthRateLimitService } from '../auth/auth-rate-limit.service';
import { UserCatalogService } from './user-catalog.service';
import { UserDependencyService } from './user-dependency.service';
import { UserEmpresaService } from './user-empresa.service';
import { UserLookupService } from './user-lookup.service';
import { UserPasswordService } from './user-password.service';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
  imports: [ConfigModule],
  providers: [UsersResolver, UsersService, UserCatalogService, UserDependencyService, UserEmpresaService, UserLookupService, UserPasswordService, AuthRateLimitService],
  exports: [UsersService]
})
export class UsersModule {}
