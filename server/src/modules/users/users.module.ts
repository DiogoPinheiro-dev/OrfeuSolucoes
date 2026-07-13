import { Module } from '@nestjs/common';
import { UserCatalogService } from './user-catalog.service';
import { UserEmpresaService } from './user-empresa.service';
import { UserLookupService } from './user-lookup.service';
import { UserPasswordService } from './user-password.service';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
  providers: [UsersResolver, UsersService, UserCatalogService, UserEmpresaService, UserLookupService, UserPasswordService],
  exports: [UsersService]
})
export class UsersModule {}
