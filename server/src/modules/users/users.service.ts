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
  empresa?: Empresa | null;
  empresasVinculadas?: Empresa[];
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
    const empresaIds = this.normalizeEmpresaIds(input.empresaIds);

    const user = (await this.prisma.usuario.create({
      data: {
        nome: input.nome,
        email,
        senhaHash,
        tipo: input.tipo ?? UserRole.USUARIO,
        ...(empresaIds.length
          ? {
              empresas: {
                create: empresaIds.map((empresaId) => ({ empresaId }))
              }
            }
          : {})
      } as never,
    })) as UsuarioWithRole;

    return this.toUserType(await this.attachEmpresas(user));
  }

  async findAll(): Promise<UserType[]> {
    const users = (await this.prisma.usuario.findMany({
      orderBy: { email: 'asc' }
    })) as UsuarioWithRole[];

    const empresasByUsuarioId = await this.findEmpresasByUsuarioIds(users.map((user) => user.id));

    return users.map((user) =>
      this.toUserType({
        ...user,
        empresasVinculadas: empresasByUsuarioId.get(user.id) ?? []
      })
    );
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
      data: data as never
    })) as UsuarioWithRole;

    if (input.empresaIds !== undefined) {
      const empresaIds = this.normalizeEmpresaIds(input.empresaIds);

      await this.prisma.empresaUsuario.deleteMany({
        where: { usuarioId: input.id }
      });

      if (empresaIds.length) {
        await this.prisma.empresaUsuario.createMany({
          data: empresaIds.map((empresaId) => ({
            usuarioId: input.id,
            empresaId
          }))
        });
      }
      return this.toUserType(await this.attachEmpresas(user));
    }

    return this.toUserType(await this.attachEmpresas(user));
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
    const empresas = user.empresasVinculadas ?? user.empresas?.map((vinculo) => vinculo.empresa).filter((empresa): empresa is Empresa => !!empresa) ?? [];
    const empresa = user.empresa ?? empresas[0] ?? null;
    const empresasType = empresas.map((empresaVinculada) => ({
      id: empresaVinculada.id,
      nome: empresaVinculada.nome ?? null,
      acessoEcommerce: empresaVinculada.acessoEcommerce ?? false,
      acessoProjetos: empresaVinculada.acessoProjetos ?? false,
      acessoHoras: empresaVinculada.acessoHoras ?? false
    }));

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
      empresas: empresasType,
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

  private async attachEmpresas(user: UsuarioWithRole): Promise<UsuarioWithRole> {
    const empresasByUsuarioId = await this.findEmpresasByUsuarioIds([user.id]);

    return {
      ...user,
      empresasVinculadas: empresasByUsuarioId.get(user.id) ?? []
    };
  }

  private async findEmpresasByUsuarioIds(usuarioIds: string[]): Promise<Map<string, Empresa[]>> {
    if (!usuarioIds.length) {
      return new Map();
    }

    const vinculos = (await this.prisma.empresaUsuario.findMany({
      where: {
        usuarioId: {
          in: usuarioIds
        }
      },
      include: {
        empresa: true
      },
      orderBy: {
        id: 'asc'
      }
    })) as (EmpresaUsuario & { empresa: Empresa })[];

    return vinculos.reduce((empresasByUsuarioId, vinculo) => {
      if (vinculo.empresa) {
        const empresas = empresasByUsuarioId.get(vinculo.usuarioId) ?? [];
        empresas.push(vinculo.empresa);
        empresasByUsuarioId.set(vinculo.usuarioId, empresas);
      }

      return empresasByUsuarioId;
    }, new Map<string, Empresa[]>());
  }

  private normalizeEmpresaIds(empresaIds?: number[] | null): number[] {
    if (!empresaIds?.length) {
      return [];
    }

    return [...new Set(empresaIds.filter((empresaId) => Number.isInteger(empresaId) && empresaId > 0))];
  }
}
