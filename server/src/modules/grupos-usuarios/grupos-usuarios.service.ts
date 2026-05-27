import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { FuncionalidadePermissao, SolucoesService } from '../solucoes/solucoes.service';
import { CreateGrupoUsuarioInput } from './dto/create-grupo-usuario.input';
import { GrupoUsuarioType } from './dto/grupo-usuario.type';
import { UpdateGrupoUsuarioInput } from './dto/update-grupo-usuario.input';

type GrupoUsuarioRecord = {
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
  solucaoIds?: number[];
  funcionalidadeIds?: number[];
  funcionalidadePermissoes?: FuncionalidadePermissao[];
};

@Injectable()
export class GruposUsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly solucoesService: SolucoesService
  ) {}

  async ensureInitialSetup(): Promise<void> {
    const [gruposCount, usuariosCount, empresasCount] = await Promise.all([
      (this.prisma as never as { grupoUsuario: { count: Function } }).grupoUsuario.count(),
      this.prisma.usuario.count(),
      this.prisma.empresa.count()
    ]);

    await this.prisma.$transaction(async (tx) => {
      let empresaId: number | null = null;

      if (empresasCount === 0) {
        const empresa = await tx.empresa.create({
          data: {
            nome: 'Empresa Teste',
            acessoEcommerce: false,
            acessoProjetos: false,
            acessoHoras: false
          }
        });

        empresaId = empresa.id;
      }

      if (gruposCount === 0 && usuariosCount === 0) {
        const grupo = (await (tx as never as { grupoUsuario: { create: Function } }).grupoUsuario.create({
          data: {
            nome: 'Administradores',
            descricao: 'Grupo inicial com acesso a todas as solucoes.',
            acessoEcommerce: true,
            acessoProjetos: true,
            acessoHoras: true,
            acessoConfigurador: true,
            podeVisualizar: true,
            podeIncluir: true,
            podeAlterar: true,
            podeExcluir: true
          }
        })) as GrupoUsuarioRecord;
        const senhaHash = await hash('admin123', 10);
        const usuario = await tx.usuario.create({
          data: {
            nome: 'Administrador',
            login: 'admin',
            email: 'admin@admin.com',
            senhaHash,
            grupoId: grupo.id,
            deveAlterarSenha: true
          } as never
        });

        if (empresaId) {
          await tx.empresaUsuario.create({
            data: {
              empresaId,
              usuarioId: usuario.id
            }
          });
        } else {
          const empresas = await tx.empresa.findMany({ select: { id: true } });

          if (empresas.length) {
            await tx.empresaUsuario.createMany({
              data: empresas.map((empresa) => ({
                empresaId: empresa.id,
                usuarioId: usuario.id
              }))
            });
          }
        }
      } else if (empresaId) {
        const usuariosComAcessoGeral = await tx.usuario.findMany({
          where: {
            login: 'admin'
          } as never,
          select: { id: true }
        });

        if (usuariosComAcessoGeral.length) {
          await tx.empresaUsuario.createMany({
            data: usuariosComAcessoGeral.map((usuario) => ({
              empresaId,
              usuarioId: usuario.id
            }))
          });
        }
      }
    });

    await this.ensureInitialAdminPasswordPolicy();
    await this.solucoesService.ensureDefaultConfiguradorFeatures();
    await this.ensureInitialAdminSolutionAccess();
  }

  private async ensureInitialAdminPasswordPolicy(): Promise<void> {
    const admin = await this.prisma.usuario.findFirst({
      where: {
        login: 'admin',
        email: 'admin@admin.com',
        grupo: {
          acessoEcommerce: true,
          acessoProjetos: true,
          acessoHoras: true,
          acessoConfigurador: true
        }
      } as never,
      select: {
        id: true,
        senhaHash: true,
        deveAlterarSenha: true
      } as never
    }) as unknown as { id: string; senhaHash: string; deveAlterarSenha: boolean } | null;

    if (!admin) {
      return;
    }

    const hasLegacyPassword = await compare('admin', admin.senhaHash);
    const hasTemporaryPassword = await compare('admin123', admin.senhaHash);

    if (!hasLegacyPassword && !hasTemporaryPassword) {
      return;
    }

    if (hasTemporaryPassword && admin.deveAlterarSenha) {
      return;
    }

    await this.prisma.usuario.update({
      where: { id: admin.id },
      data: {
        senhaHash: await hash('admin123', 10),
        deveAlterarSenha: true
      } as never
    });
  }

  private async ensureInitialAdminSolutionAccess(): Promise<void> {
    const admin = await this.prisma.usuario.findFirst({
      where: {
        login: 'admin',
        email: 'admin@admin.com',
        grupoId: { not: null }
      } as never,
      select: {
        grupoId: true
      } as never
    }) as unknown as { grupoId: number | null } | null;

    if (!admin?.grupoId) {
      return;
    }

    const solucoes = await this.solucoesService.findAll();
    const adminSolucoes = solucoes.filter((solucao) => solucao.slug === 'configurador' || !solucao.somenteAdminSistema);
    const adminFuncionalidades = adminSolucoes.flatMap((solucao) => solucao.funcionalidades);

    await this.solucoesService.syncGroupAccess(
      admin.grupoId,
      adminSolucoes.map((solucao) => solucao.id),
      adminFuncionalidades.map((funcionalidade) => funcionalidade.id),
      adminFuncionalidades.map((funcionalidade) => ({
        funcionalidadeId: funcionalidade.id,
        podeVisualizar: true,
        podeIncluir: true,
        podeAlterar: true,
        podeExcluir: true
      }))
    );
  }

  async findAll(): Promise<GrupoUsuarioType[]> {
    const grupos = (await (this.prisma as never as { grupoUsuario: { findMany: Function } }).grupoUsuario.findMany({
      orderBy: { nome: 'asc' }
    })) as GrupoUsuarioRecord[];

    return Promise.all(grupos.map((grupo) => this.toType(grupo)));
  }

  async findById(id?: number | null): Promise<GrupoUsuarioType | null> {
    if (!id) {
      return null;
    }

    const grupo = (await (this.prisma as never as { grupoUsuario: { findUnique: Function } }).grupoUsuario.findUnique({
      where: { id }
    })) as GrupoUsuarioRecord | null;

    return grupo ? this.toType(grupo) : null;
  }

  async create(input: CreateGrupoUsuarioInput): Promise<GrupoUsuarioType> {
    const nome = input.nome.trim();
    const existing = (await (this.prisma as never as { grupoUsuario: { findUnique: Function } }).grupoUsuario.findUnique({
      where: { nome }
    })) as GrupoUsuarioRecord | null;

    if (existing) {
      throw new ConflictException('Grupo de usuario ja cadastrado.');
    }

    const created = (await (this.prisma as never as { grupoUsuario: { create: Function } }).grupoUsuario.create({
      data: {
        nome,
        descricao: input.descricao?.trim() || null,
        acessoEcommerce: input.acessoEcommerce ?? false,
        acessoProjetos: input.acessoProjetos ?? false,
        acessoHoras: input.acessoHoras ?? false,
        acessoConfigurador: input.acessoConfigurador ?? false,
        podeVisualizar: input.podeVisualizar ?? true,
        podeIncluir: input.podeIncluir ?? false,
        podeAlterar: input.podeAlterar ?? false,
        podeExcluir: input.podeExcluir ?? false
      }
    })) as GrupoUsuarioRecord;

    await this.solucoesService.syncGroupAccess(
      created.id,
      input.solucaoIds ?? [],
      input.funcionalidadeIds ?? [],
      this.resolveFuncionalidadePermissoes(input.funcionalidadeIds ?? [], input.funcionalidadePermissoes, input)
    );

    return this.toType(created);
  }

  async update(input: UpdateGrupoUsuarioInput): Promise<GrupoUsuarioType> {
    const current = (await (this.prisma as never as { grupoUsuario: { findUnique: Function } }).grupoUsuario.findUnique({
      where: { id: input.id }
    })) as GrupoUsuarioRecord | null;

    if (!current) {
      throw new NotFoundException('Grupo de usuario nao encontrado.');
    }

    const updated = (await (this.prisma as never as { grupoUsuario: { update: Function } }).grupoUsuario.update({
      where: { id: input.id },
      data: {
        ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
        ...(input.descricao !== undefined ? { descricao: input.descricao?.trim() || null } : {}),
        ...(input.acessoEcommerce !== undefined ? { acessoEcommerce: input.acessoEcommerce } : {}),
        ...(input.acessoProjetos !== undefined ? { acessoProjetos: input.acessoProjetos } : {}),
        ...(input.acessoHoras !== undefined ? { acessoHoras: input.acessoHoras } : {}),
        ...(input.acessoConfigurador !== undefined ? { acessoConfigurador: input.acessoConfigurador } : {}),
        ...(input.podeVisualizar !== undefined ? { podeVisualizar: input.podeVisualizar } : {}),
        ...(input.podeIncluir !== undefined ? { podeIncluir: input.podeIncluir } : {}),
        ...(input.podeAlterar !== undefined ? { podeAlterar: input.podeAlterar } : {}),
        ...(input.podeExcluir !== undefined ? { podeExcluir: input.podeExcluir } : {})
      }
    })) as GrupoUsuarioRecord;

    if (input.solucaoIds !== undefined || input.funcionalidadeIds !== undefined || input.funcionalidadePermissoes !== undefined) {
      const funcionalidadeIds = input.funcionalidadeIds ?? input.funcionalidadePermissoes?.map((permissao) => permissao.funcionalidadeId) ?? [];

      await this.solucoesService.syncGroupAccess(
        input.id,
        input.solucaoIds ?? [],
        funcionalidadeIds,
        this.resolveFuncionalidadePermissoes(funcionalidadeIds, input.funcionalidadePermissoes, { ...current, ...input })
      );
    }

    return this.toType(updated);
  }

  async remove(id: number): Promise<boolean> {
    const current = (await (this.prisma as never as { grupoUsuario: { findUnique: Function } }).grupoUsuario.findUnique({
      where: { id }
    })) as GrupoUsuarioRecord | null;

    if (!current) {
      throw new NotFoundException('Grupo de usuario nao encontrado.');
    }

    await (this.prisma as never as { usuario: { updateMany: Function } }).usuario.updateMany({
      where: { grupoId: id },
      data: { grupoId: null }
    });
    await (this.prisma as never as { grupoUsuario: { delete: Function } }).grupoUsuario.delete({ where: { id } });

    return true;
  }

  async toType(grupo: GrupoUsuarioRecord): Promise<GrupoUsuarioType> {
    const access = await this.solucoesService.findGroupAccess(grupo.id);

    return {
      id: grupo.id,
      nome: grupo.nome,
      descricao: grupo.descricao ?? null,
      acessoEcommerce: grupo.acessoEcommerce ?? false,
      acessoProjetos: grupo.acessoProjetos ?? false,
      acessoHoras: grupo.acessoHoras ?? false,
      acessoConfigurador: grupo.acessoConfigurador ?? false,
      podeVisualizar: grupo.podeVisualizar ?? true,
      podeIncluir: grupo.podeIncluir ?? false,
      podeAlterar: grupo.podeAlterar ?? false,
      podeExcluir: grupo.podeExcluir ?? false,
      solucaoIds: access.solucaoIds,
      funcionalidadeIds: access.funcionalidadeIds,
      funcionalidadePermissoes: access.funcionalidadePermissoes.map((permissao) => ({
        ...permissao,
        acoes: permissao.acoes.map((acao) => ({
          funcionalidadeId: acao.funcionalidadeId,
          acaoId: acao.acaoId,
          chave: acao.chave ?? '',
          permitido: !!acao.permitido
        }))
      }))
    };
  }

  private resolveFuncionalidadePermissoes(
    funcionalidadeIds: number[],
    permissoes: FuncionalidadePermissao[] | undefined,
    defaults: {
      podeVisualizar?: boolean;
      podeIncluir?: boolean;
      podeAlterar?: boolean;
      podeExcluir?: boolean;
    }
  ): FuncionalidadePermissao[] {
    const permissoesByFuncionalidadeId = new Map(
      (permissoes ?? []).map((permissao) => [permissao.funcionalidadeId, permissao])
    );

    return [...new Set(funcionalidadeIds)].map((funcionalidadeId) => {
      const permissao = permissoesByFuncionalidadeId.get(funcionalidadeId);

      return {
        funcionalidadeId,
        podeVisualizar: permissao?.podeVisualizar ?? defaults.podeVisualizar ?? true,
        podeIncluir: permissao?.podeIncluir ?? defaults.podeIncluir ?? false,
        podeAlterar: permissao?.podeAlterar ?? defaults.podeAlterar ?? false,
        podeExcluir: permissao?.podeExcluir ?? defaults.podeExcluir ?? false
      };
    });
  }
}
