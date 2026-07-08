import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { SolucoesService } from '../solucoes/solucoes.service';
import { GrupoUsuarioRecord } from './types/grupo-usuario-record.types';

@Injectable()
export class GrupoUsuarioBootstrapService {
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
            acessoHoras: false,
            padraoSistema: true
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
            podeExcluir: true,
            padraoSistema: true
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
            deveAlterarSenha: true,
            padraoSistema: true
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
    await this.solucoesService.ensureControleChamadosSolution();
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
}
