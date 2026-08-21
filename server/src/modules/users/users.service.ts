import { Injectable } from '@nestjs/common';
import { Usuario } from '@prisma/client';
import { AuthRateLimitService } from '../auth/auth-rate-limit.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateUserInput } from './dto/create-user.input';
import { RegisterUserInput } from './dto/register-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserType } from './dto/user.type';
import { UserCatalogService } from './user-catalog.service';
import { UserLookupService } from './user-lookup.service';
import { UserPasswordService } from './user-password.service';
import { assertSystemAdmin } from './policies/user.policy';
import { UsuarioWithRole } from './types/user-record.types';

@Injectable()
export class UsersService {
  constructor(
    private readonly userCatalogService: UserCatalogService,
    private readonly userLookupService: UserLookupService,
    private readonly userPasswordService: UserPasswordService,
    private readonly authRateLimitService: AuthRateLimitService
  ) {}

  create(input: CreateUserInput): Promise<UserType> {
    return this.userCatalogService.create(input);
  }

  createAsAdmin(input: CreateUserInput, currentUser: JwtPayload): Promise<UserType> {
    assertSystemAdmin(currentUser);
    return this.userCatalogService.create(input);
  }

  register(input: RegisterUserInput, clientAddress?: string | null): Promise<UserType> {
    this.authRateLimitService.consumeRegistrationAttempt(clientAddress);
    return this.userCatalogService.register(input);
  }

  findAll(currentUser?: JwtPayload): Promise<UserType[]> {
    return this.userCatalogService.findAll(currentUser);
  }

  update(input: UpdateUserInput): Promise<UserType> {
    return this.userCatalogService.update(input);
  }

  remove(id: string): Promise<boolean> {
    return this.userCatalogService.remove(id);
  }

  updatePassword(id: string, senha: string, deveAlterarSenha: boolean): Promise<void> {
    return this.userPasswordService.updatePassword(id, senha, deveAlterarSenha);
  }

  revokeSessions(id: string): Promise<void> {
    return this.userPasswordService.revokeSessions(id);
  }

  findById(id: string): Promise<Usuario> {
    return this.userLookupService.findById(id);
  }

  findTypeById(id: string): Promise<UserType> {
    return this.userCatalogService.findTypeById(id);
  }

  findByEmail(email: string): Promise<UsuarioWithRole | null> {
    return this.userLookupService.findByEmail(email);
  }

  findByLoginOrEmail(loginOrEmail: string): Promise<UsuarioWithRole | null> {
    return this.userLookupService.findByLoginOrEmail(loginOrEmail);
  }
}
