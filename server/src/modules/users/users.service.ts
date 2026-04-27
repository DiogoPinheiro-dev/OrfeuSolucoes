import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Empresa, EmpresaUsuario, Usuario } from '@prisma/client';
import { hash } from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserRole } from './dto/user-role.enum';
import { UserType } from './dto/user.type';

type UsuarioWithRole = Usuario & {
  tipo?: string;
  empresas?: (EmpresaUsuario & { empresa?: Empresa | null })[];
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
        tipo: input.tipo ?? UserRole.USUARIO,
        ...(input.empresaId
          ? {
              empresas: {
                create: {
                  empresaId: input.empresaId
                }
              }
            }
          : {})
      } as never,
      include: {
        empresas: {
          include: { empresa: true },
          take: 1
        }
      } as never
    })) as UsuarioWithRole;

    return this.toUserType(user);
  }

  async findAll(): Promise<UserType[]> {
    const users = (await this.prisma.usuario.findMany({
      orderBy: { email: 'asc' },
      include: {
        empresas: {
          include: { empresa: true },
          take: 1
        }
      } as never
    })) as UsuarioWithRole[];

    return users.map((user) => this.toUserType(user));
  }

  async update(input: UpdateUserInput): Promise<UserType> {
    const userExists = await this.prisma.usuario.findUnique({ where: { id: input.id } });

    if (!userExists) {
      throw new NotFoundException('UsuÃ¡rio nÃ£o encontrado.');
    }

    const data: Record<string, unknown> = {};

    if (input.nome !== undefined) {
      data.nome = input.nome;
    }

    if (input.email !== undefined) {
      const email = input.email.toLowerCase();
      const emailOwner = await this.prisma.usuario.findUnique({ where: { email } });

      if (emailOwner && emailOwner.id !== input.id) {
        throw new ConflictException('Email jÃ¡ estÃ¡ em uso.');
      }

      data.email = email;
    }

    if (input.senha) {
      data.senhaHash = await hash(input.senha, 10);
    }

    if (input.tipo) {
      data.tipo = input.tipo;
    }

    const user = (await this.prisma.usuario.update({
      where: { id: input.id },
      data: data as never,
      include: {
        empresas: {
          include: { empresa: true },
          take: 1
        }
      } as never
    })) as UsuarioWithRole;

    if (input.empresaId !== undefined) {
      await this.prisma.empresaUsuario.deleteMany({
        where: { usuarioId: input.id }
      });

      if (input.empresaId) {
        await this.prisma.empresaUsuario.create({
          data: {
            usuarioId: input.id,
            empresaId: input.empresaId
          }
        });
      }

      return this.toUserType(
        (await this.prisma.usuario.findUnique({
          where: { id: input.id },
          include: {
            empresas: {
              include: { empresa: true },
              take: 1
            }
          } as never
        })) as UsuarioWithRole
      );
    }

    return this.toUserType(user);
  }

  async remove(id: string): Promise<boolean> {
    const userExists = await this.prisma.usuario.findUnique({ where: { id } });

    if (!userExists) {
      throw new NotFoundException('UsuÃ¡rio nÃ£o encontrado.');
    }

    await this.prisma.empresaUsuario.deleteMany({
      where: { usuarioId: id }
    });
    await this.prisma.usuario.delete({ where: { id } });

    return true;
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
    const tipo = this.toGraphqlRole(user.tipo);
    const empresa = user.empresas?.[0]?.empresa;

    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo,
      empresa: empresa
        ? {
            id: empresa.id,
            nome: empresa.nome ?? null,
            acessoEcommerce: empresa.acessoEcommerce ?? false,
            acessoProjetos: empresa.acessoProjetos ?? false,
            acessoHoras: empresa.acessoHoras ?? false
          }
        : null,
      availableSolutions: this.resolveDefaultSolutions(tipo)
    };
  }

  private toGraphqlRole(role?: string): UserRole {
    if (role === UserRole.CLIENTE || role === UserRole.USUARIO || role === UserRole.ADMIN) {
      return role as UserRole;
    }

    return UserRole.USUARIO;
  }

  private resolveDefaultSolutions(role: UserRole): string[] {
    if (role === UserRole.ADMIN) {
      return ['ecommerce', 'projetos', 'horas', 'configurador'];
    }

    if (role === UserRole.USUARIO) {
      return ['ecommerce'];
    }

    return [];
  }
}
