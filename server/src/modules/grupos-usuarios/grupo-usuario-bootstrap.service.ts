import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { isPrismaUniqueConstraintViolation, retryBootstrapAfterUniqueConflict } from '../../common/persistence/bootstrap-concurrency.util';
import { normalizeAndValidatePassword } from '../../common/security/password.policy';
import { PrismaService } from '../../prisma/prisma.service';
import { SolucoesService } from '../solucoes/solucoes.service';
import { GrupoUsuarioRecord } from './types/grupo-usuario-record.types';

@Injectable()
export class GrupoUsuarioBootstrapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly solucoesService: SolucoesService,
    private readonly configService: ConfigService
  ) {}

  async ensureInitialSetup(): Promise<void> {
    const [gruposCount, usuariosCount, empresasCount] = await Promise.all([
      (this.prisma as never as { grupoUsuario: { count: Function } }).grupoUsuario.count(),
      this.prisma.usuario.count(),
      this.prisma.empresa.count()
    ]);
    const shouldCreateInitialAdmin = gruposCount === 0 && usuariosCount === 0;
    const initialAdminPassword = shouldCreateInitialAdmin
      ? this.requireInitialAdminPassword()
      : null;

    try {
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

      if (shouldCreateInitialAdmin) {
        const grupo = (await (tx as never as { grupoUsuario: { create: Function } }).grupoUsuario.create({
          data: {
            nome: 'Administradores',
            descricao: 'Grupo inicial com acesso a todas as soluções.',
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
        const senhaHash = await hash(initialAdminPassword as string, 10);
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
            padraoSistema: true
          },
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
    } catch (error) {
      if (!isPrismaUniqueConstraintViolation(error)) {
        throw error;
      }
    }

    await this.ensureInitialAdminPasswordPolicy();
    await this.ensureInitialAdminGroupMetadata();
    await this.solucoesService.ensureDocumentationSolution();
    await this.solucoesService.ensureDefaultConfiguradorFeatures();
    await this.solucoesService.ensureControleChamadosSolution();
    await this.solucoesService.ensureProjetosSolution();
    await this.solucoesService.ensureHorasSolutionUnavailable();
    await retryBootstrapAfterUniqueConflict(() => this.ensureInitialAdminSolutionAccess());
  }

  private async ensureInitialAdminGroupMetadata(): Promise<void> {
    const grupo = await (this.prisma as never as { grupoUsuario: { findFirst: Function } }).grupoUsuario.findFirst({
      where: { padraoSistema: true },
      select: { id: true }
    }) as { id: number } | null;

    if (!grupo) {
      return;
    }

    await (this.prisma as never as { grupoUsuario: { update: Function } }).grupoUsuario.update({
      where: { id: grupo.id },
      data: {
        nome: 'Administradores',
        descricao: 'Grupo inicial com acesso a todas as soluções.'
      }
    });
  }

  private async ensureInitialAdminPasswordPolicy(): Promise<void> {
    const admin = await this.prisma.usuario.findFirst({
      where: {
        padraoSistema: true
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

    const initialAdminPassword = this.requireInitialAdminPassword();

    await this.prisma.usuario.update({
      where: { id: admin.id },
      data: {
        senhaHash: await hash(initialAdminPassword, 10),
        deveAlterarSenha: true,
        sessaoVersao: { increment: 1 }
      }
    });
  }

  private requireInitialAdminPassword(): string {
    const configuredPassword = this.configService.get<string>('INITIAL_ADMIN_PASSWORD');

    if (!configuredPassword) {
      throw new Error(
        'INITIAL_ADMIN_PASSWORD is required to create or secure the initial administrator.'
      );
    }

    return normalizeAndValidatePassword(configuredPassword);
  }

  private async ensureInitialAdminSolutionAccess(): Promise<void> {
    const admin = await this.prisma.usuario.findFirst({
      where: {
        padraoSistema: true,
        grupoId: { not: null }
      },
      select: {
        grupoId: true
      } as never
    }) as unknown as { grupoId: number | null } | null;

    if (!admin?.grupoId) {
      return;
    }

    const solucoes = await this.solucoesService.findAll();
    const adminSolucoes = solucoes.filter((solucao) => solucao.ativo && (solucao.slug === 'configurador' || !solucao.somenteAdminSistema));
    const adminFuncionalidades = adminSolucoes.flatMap((solucao) => solucao.funcionalidades.filter((funcionalidade) => funcionalidade.ativo));

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
