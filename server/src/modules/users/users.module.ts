import { Module } from '@nestjs/common';
import { UserEmpresaService } from './user-empresa.service';
import { UserPasswordService } from './user-password.service';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
  providers: [UsersResolver, UsersService, UserEmpresaService, UserPasswordService],
  exports: [UsersService]
})
export class UsersModule {}
