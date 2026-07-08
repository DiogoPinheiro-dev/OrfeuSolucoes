import { Injectable, NotFoundException } from '@nestjs/common';
import { Usuario } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserType } from './dto/user.type';
import { UserCatalogService } from './user-catalog.service';
import { UserPasswordService } from './user-password.service';
import { UsuarioWithRole } from './types/user-record.types';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userCatalogService: UserCatalogService,
    private readonly userPasswordService: UserPasswordService
  ) {}

  create(input: CreateUserInput): Promise<UserType> {
    return this.userCatalogService.create(input);
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

  async findById(id: string): Promise<Usuario> {
    const user = await this.prisma.usuario.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    return user;
  }

  findTypeById(id: string): Promise<UserType> {
    return this.userCatalogService.findTypeById(id);
  }

  async findByEmail(email: string): Promise<UsuarioWithRole | null> {
    return (await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
      include: { grupo: true } as never
    })) as UsuarioWithRole | null;
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<UsuarioWithRole | null> {
    const identifier = loginOrEmail.toLowerCase().trim();

    return (await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { email: identifier },
          { login: identifier } as never
        ]
      },
      include: { grupo: true } as never
    })) as UsuarioWithRole | null;
  }
}