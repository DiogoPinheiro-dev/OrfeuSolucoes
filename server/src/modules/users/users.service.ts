import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Usuario } from '@prisma/client';
import { hash } from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { UserRole } from './dto/user-role.enum';
import { UserType } from './dto/user.type';

type UsuarioWithRole = Usuario & {
  tipo?: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<UserType> {
    const email = input.email.toLowerCase();
    const userExists = await this.prisma.usuario.findUnique({ where: { email } });

    if (userExists) {
      throw new ConflictException('Email já está em uso.');
    }

    const senhaHash = await hash(input.senha, 10);

    const user = (await this.prisma.usuario.create({
      data: {
        nome: input.nome,
        email,
        senhaHash,
        tipo: input.tipo ?? UserRole.CLIENTE
      } as never
    })) as UsuarioWithRole;

    return this.toUserType(user);
  }

  async findAll(): Promise<UserType[]> {
    const users = (await this.prisma.usuario.findMany({
      orderBy: { email: 'asc' }
    })) as UsuarioWithRole[];

    return users.map((user) => this.toUserType(user));
  }

  async findById(id: string): Promise<Usuario> {
    const user = await this.prisma.usuario.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async findByEmail(email: string): Promise<UsuarioWithRole | null> {
    return (await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase() }
    })) as UsuarioWithRole | null;
  }

  toUserType(user: UsuarioWithRole): UserType {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: this.toGraphqlRole(user.tipo)
    };
  }

  private toGraphqlRole(role?: string): UserRole {
    if (role === UserRole.FUNCIONARIO || role === UserRole.ADMIN) {
      return role;
    }

    return UserRole.CLIENTE;
  }
}
