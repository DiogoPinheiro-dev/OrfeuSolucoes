import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Empresa, EmpresaUsuario, Usuario } from '@prisma/client';
import { hash } from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserType } from './dto/user.type';

type UsuarioWithRole = Usuario & {
  login?: string | null;
  grupoId?: number | null;
  grupo?: {
    id: number;
    nome: string;
    descricao?: string | null;
    acessoEcommerce?: boolean;
    acessoProjetos?: boolean;
    acessoHoras?: boolean;
    acessoConfigurador?: boolean;
    podeVisualizar?: boolean;
    podeIncluir?: boolean;
    podeAlterar?: boolean;
    podeExcluir?: boolean;
  } | null;
  deveAlterarSenha?: boolean;
  empresas?: (EmpresaUsuario & { empresa?: Empresa | null })[];
  empresa?: Empresa | null;
  empresasVinculadas?: Empresa[];
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<UserType> {
    const email = input.email.toLowerCase();
    const login = this.normalizeLogin(input.login);
    const userExists = await this.prisma.usuario.findUnique({ where: { email } });

    if (userExists) {
      throw new ConflictException('Email já está em uso.');
    }

    if (login) {
      const loginExists = (await this.prisma.usuario.findFirst({ where: { login } as never })) as UsuarioWithRole | null;

      if (loginExists) {
        throw new ConflictException('Login ja esta em uso.');
      }
    }

    const senhaHash = await hash(input.senha, 10);
    const empresaIds = this.normalizeEmpresaIds(input.empresaIds);

    const user = (await this.prisma.usuario.create({
      data: {
        nome: input.nome,
        login,
        email,
        senhaHash,
        grupoId: input.grupoId ?? null,
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

  async findAll(currentUser?: JwtPayload): Promise<UserType[]> {
    await this.ensureAdminLinkedToAllCompanies();

    const users = (await this.prisma.usuario.findMany({
      include: { grupo: true } as never,
      orderBy: { email: 'asc' }
    })) as UsuarioWithRole[];
    const visibleUsers =
      this.hasFullGroupAccess(currentUser?.grupo) ? users : users.filter((user) => !this.hasFullGroupAccess(user.grupo));

    const empresasByUsuarioId = await this.findEmpresasByUsuarioIds(visibleUsers.map((user) => user.id));

    return visibleUsers.map((user) =>
      this.toUserType({
        ...user,
        empresasVinculadas: empresasByUsuarioId.get(user.id) ?? []
      })
    );
  }

  async update(input: UpdateUserInput): Promise<UserType> {
    const userExists = await this.prisma.usuario.findUnique({ where: { id: input.id } });

    if (!userExists) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const existingUser = (await this.prisma.usuario.findUnique({
      where: { id: input.id },
      include: { grupo: true } as never
    })) as UsuarioWithRole | null;

    if (this.isSystemAdmin(existingUser)) {
      throw new BadRequestException('O usuario administrador inicial nao pode ser alterado.');
    }

    const data: Record<string, unknown> = {};

    if (input.nome !== undefined) {
      data.nome = input.nome;
    }

    if (input.email !== undefined) {
      const email = input.email.toLowerCase();
      const emailOwner = await this.prisma.usuario.findUnique({ where: { email } });

      if (emailOwner && emailOwner.id !== input.id) {
        throw new ConflictException('Email já está em uso.');
      }

      data.email = email;
    }

    if (input.login !== undefined) {
      const login = this.normalizeLogin(input.login);

      if (login) {
        const loginOwner = (await this.prisma.usuario.findFirst({ where: { login } as never })) as UsuarioWithRole | null;

        if (loginOwner && loginOwner.id !== input.id) {
          throw new ConflictException('Login ja esta em uso.');
        }
      }

      data.login = login;
    }

    if (input.senha) {
      data.senhaHash = await hash(input.senha, 10);
    }

    if (input.grupoId !== undefined) {
      data.grupoId = input.grupoId || null;
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
      throw new NotFoundException('Usuário não encontrado.');
    }

    const userWithGroup = (await this.prisma.usuario.findUnique({
      where: { id },
      include: { grupo: true } as never
    })) as UsuarioWithRole | null;

    if (this.isSystemAdmin(userWithGroup)) {
      throw new BadRequestException('O usuario administrador inicial nao pode ser excluido.');
    }

    await this.prisma.empresaUsuario.deleteMany({
      where: { usuarioId: id }
    });
    await this.prisma.usuario.delete({ where: { id } });

    return true;
  }

  async updatePassword(id: string, senha: string, deveAlterarSenha: boolean): Promise<void> {
    const senhaHash = await hash(senha, 10);

    await this.prisma.usuario.update({
      where: { id },
      data: {
        senhaHash,
        deveAlterarSenha
      } as never
    });
  }

  async findById(id: string): Promise<Usuario> {
    const user = await this.prisma.usuario.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async findTypeById(id: string): Promise<UserType> {
    const user = (await this.prisma.usuario.findUnique({
      where: { id },
      include: { grupo: true } as never
    })) as UsuarioWithRole | null;

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return this.toUserType(await this.attachEmpresas(user));
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

  toUserType(user: UsuarioWithRole): UserType {
    const empresas = user.empresasVinculadas ?? user.empresas?.map((vinculo) => vinculo.empresa).filter((empresa): empresa is Empresa => !!empresa) ?? [];
    const empresa = user.empresa ?? empresas[0] ?? null;
    const isAdminGroup = this.hasFullGroupAccess(user.grupo);
    const empresasType = empresas.map((empresaVinculada) => ({
      id: empresaVinculada.id,
      nome: empresaVinculada.nome ?? null,
      acessoEcommerce: empresaVinculada.acessoEcommerce ?? false,
      acessoProjetos: empresaVinculada.acessoProjetos ?? false,
      acessoHoras: empresaVinculada.acessoHoras ?? false,
      solucaoIds: [],
      funcionalidadeIds: []
    }));

    return {
      id: user.id,
      nome: user.nome,
      login: user.login ?? null,
      email: user.email,
      empresa: empresa
        ? {
            id: empresa.id,
            nome: empresa.nome ?? null,
            acessoEcommerce: empresa.acessoEcommerce ?? false,
            acessoProjetos: empresa.acessoProjetos ?? false,
            acessoHoras: empresa.acessoHoras ?? false,
            solucaoIds: [],
            funcionalidadeIds: []
          }
        : null,
      empresas: empresasType,
      grupo: user.grupo
        ? {
            id: user.grupo.id,
            nome: user.grupo.nome,
            descricao: user.grupo.descricao ?? null,
            acessoEcommerce: user.grupo.acessoEcommerce ?? false,
            acessoProjetos: user.grupo.acessoProjetos ?? false,
            acessoHoras: user.grupo.acessoHoras ?? false,
            acessoConfigurador: user.grupo.acessoConfigurador ?? false,
            podeVisualizar: isAdminGroup || (user.grupo.podeVisualizar ?? true),
            podeIncluir: isAdminGroup || (user.grupo.podeIncluir ?? false),
            podeAlterar: isAdminGroup || (user.grupo.podeAlterar ?? false),
            podeExcluir: isAdminGroup || (user.grupo.podeExcluir ?? false),
            solucaoIds: [],
            funcionalidadeIds: [],
            funcionalidadePermissoes: []
          }
        : null,
      podeVisualizar: isAdminGroup || (user.grupo?.podeVisualizar ?? false),
      podeIncluir: isAdminGroup || (user.grupo?.podeIncluir ?? false),
      podeAlterar: isAdminGroup || (user.grupo?.podeAlterar ?? false),
      podeExcluir: isAdminGroup || (user.grupo?.podeExcluir ?? false),
      deveAlterarSenha: user.deveAlterarSenha ?? false,
      availableSolutions: this.resolveDefaultSolutions(user)
    };
  }

  private resolveDefaultSolutions(user: UsuarioWithRole): string[] {
    const grupo = user.grupo;
    const canAccessConfigurador = this.isSystemAdmin(user);

    if (this.hasFullGroupAccess(grupo)) {
      return [
        'ecommerce',
        'projetos',
        'horas',
        canAccessConfigurador ? 'configurador' : null
      ].filter((solution): solution is string => !!solution);
    }

    if (grupo) {
      return [
        grupo.acessoEcommerce ? 'ecommerce' : null,
        grupo.acessoProjetos ? 'projetos' : null,
        grupo.acessoHoras ? 'horas' : null,
        grupo.acessoConfigurador && canAccessConfigurador ? 'configurador' : null
      ].filter((solution): solution is string => !!solution);
    }

    return ['ecommerce'];
  }

  private isSystemAdmin(user?: { login?: string | null } | null): boolean {
    return user?.login?.toLowerCase() === 'admin';
  }

  private async attachEmpresas(user: UsuarioWithRole): Promise<UsuarioWithRole> {
    const empresasByUsuarioId = await this.findEmpresasByUsuarioIds([user.id]);
    const usuarioComGrupo = (await this.prisma.usuario.findUnique({
      where: { id: user.id },
      include: { grupo: true } as never
    })) as UsuarioWithRole | null;

    return {
      ...user,
      grupo: usuarioComGrupo?.grupo ?? user.grupo ?? null,
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

  private normalizeLogin(login?: string | null): string | null {
    const normalized = login?.toLowerCase().trim();

    return normalized || null;
  }

  private async findAllEmpresaIds(): Promise<number[]> {
    const empresas = await this.prisma.empresa.findMany({
      select: { id: true }
    });

    return empresas.map((empresa) => empresa.id);
  }

  private async ensureAdminLinkedToAllCompanies(): Promise<void> {
    const admins = (await this.prisma.usuario.findMany({
      where: {
        login: 'admin'
      } as never,
      select: { id: true }
    })) as { id: string }[];

    if (!admins.length) {
      return;
    }

    const empresaIds = await this.findAllEmpresaIds();

    if (!empresaIds.length) {
      return;
    }

    const adminIds = admins.map((admin) => admin.id);
    const vinculos = await this.prisma.empresaUsuario.findMany({
      where: { usuarioId: { in: adminIds } },
      select: { empresaId: true, usuarioId: true }
    });
    const linkedKeys = new Set(vinculos.map((vinculo) => `${vinculo.usuarioId}:${vinculo.empresaId}`));
    const missingLinks = adminIds.flatMap((usuarioId) =>
      empresaIds
        .filter((empresaId) => !linkedKeys.has(`${usuarioId}:${empresaId}`))
        .map((empresaId) => ({ empresaId, usuarioId }))
    );

    if (!missingLinks.length) {
      return;
    }

    await this.prisma.empresaUsuario.createMany({
      data: missingLinks
    });
  }

  private hasFullGroupAccess(
    grupo?: {
      acessoEcommerce?: boolean;
      acessoProjetos?: boolean;
      acessoHoras?: boolean;
      acessoConfigurador?: boolean;
    } | null
  ): boolean {
    return !!(
      grupo?.acessoEcommerce &&
      grupo.acessoProjetos &&
      grupo.acessoHoras &&
      grupo.acessoConfigurador
    );
  }
}
