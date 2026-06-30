import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { SolucoesService } from '../solucoes/solucoes.service';
import { CreateEmpresaInput } from './dto/create-empresa.input';
import { EmpresaType } from './dto/empresa.type';
import { UpdateEmpresaInput } from './dto/update-empresa.input';

export type EmpresaRecord = {
  id: number;
  nome?: string | null;
  acessoEcommerce?: boolean;
  acessoProjetos?: boolean;
  acessoHoras?: boolean;
};

@Injectable()
export class EmpresasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly solucoesService: SolucoesService
  ) {}

  async create(input: CreateEmpresaInput, admin: JwtPayload): Promise<EmpresaType> {
    this.assertAdmin(admin, 'cadastrar empresas');

    const empresa = (await this.prisma.$transaction(async (tx) => {
      const systemAdmins = await tx.usuario.findMany({
        where: {
          login: 'admin'
        } as never,
        select: { id: true }
      });

      const createdEmpresa = await tx.empresa.create({
        data: {
          nome: input.nome ?? null,
          acessoEcommerce: input.acessoEcommerce ?? false,
          acessoProjetos: input.acessoProjetos ?? false,
          acessoHoras: input.acessoHoras ?? false
        }
      });

      if (systemAdmins.length) {
        await tx.empresaUsuario.createMany({
          data: systemAdmins.map((systemAdmin) => ({
            empresaId: createdEmpresa.id,
            usuarioId: systemAdmin.id
          }))
        });
      }

      return createdEmpresa;
    })) as EmpresaRecord;

    await this.solucoesService.syncCompanyAccess(
      empresa.id,
      input.solucaoIds ?? [],
      await this.resolveFuncionalidadeIds(input.solucaoIds ?? [], input.funcionalidadeIds)
    );

    return this.toEmpresaType(empresa);
  }

  async findAll(): Promise<EmpresaType[]> {
    await this.ensureAdminLinkedToAllCompanies();

    const empresas = (await this.prisma.empresa.findMany({
      orderBy: { nome: 'asc' }
    })) as EmpresaRecord[];

    return Promise.all(empresas.map((empresa) => this.toEmpresaType(empresa)));
  }

  async findById(id: number): Promise<EmpresaRecord> {
    const empresa = (await this.prisma.empresa.findUnique({
      where: { id }
    })) as EmpresaRecord | null;

    if (!empresa) {
      throw new NotFoundException('Empresa nao encontrada.');
    }

    return empresa;
  }

  async findByUserId(usuarioId: string): Promise<EmpresaType[]> {
    await this.ensureAdminLinkedToAllCompanies();

    const vinculos = await this.prisma.empresaUsuario.findMany({
      where: { usuarioId },
      include: { empresa: true },
      orderBy: { id: 'asc' }
    });

    return Promise.all(vinculos
      .map((vinculo) => vinculo.empresa)
      .filter(Boolean)
      .map((empresa) => this.toEmpresaType(empresa as EmpresaRecord)));
  }

  async update(input: UpdateEmpresaInput, admin: JwtPayload): Promise<EmpresaType> {
    this.assertAdmin(admin, 'alterar empresas');

    await this.findById(input.id);

    const empresa = (await this.prisma.empresa.update({
      where: { id: input.id },
      data: {
        ...(input.nome !== undefined ? { nome: input.nome ?? null } : {}),
        ...(input.acessoEcommerce !== undefined ? { acessoEcommerce: input.acessoEcommerce } : {}),
        ...(input.acessoProjetos !== undefined ? { acessoProjetos: input.acessoProjetos } : {}),
        ...(input.acessoHoras !== undefined ? { acessoHoras: input.acessoHoras } : {})
      }
    })) as EmpresaRecord;

    if (input.solucaoIds !== undefined || input.funcionalidadeIds !== undefined) {
      await this.solucoesService.syncCompanyAccess(
        input.id,
        input.solucaoIds ?? [],
        await this.resolveFuncionalidadeIds(input.solucaoIds ?? [], input.funcionalidadeIds)
      );
    }

    return this.toEmpresaType(empresa);
  }

  async remove(id: number, admin: JwtPayload): Promise<boolean> {
    this.assertAdmin(admin, 'remover empresas');

    await this.findById(id);

    await this.prisma.$transaction(async (tx) => {
      const vinculos = (await tx.empresaUsuario.findMany({
        where: { empresaId: id },
        include: { usuario: { include: { grupo: true } } } as never
      })) as unknown as Array<{
        usuarioId: string;
        usuario: {
          grupo?: {
            acessoEcommerce?: boolean;
            acessoProjetos?: boolean;
            acessoHoras?: boolean;
            acessoConfigurador?: boolean;
          } | null;
        };
      }>;
      const usuariosParaRemover: string[] = [];

      for (const vinculo of vinculos) {
        const outrosVinculos = await tx.empresaUsuario.count({
          where: {
            usuarioId: vinculo.usuarioId,
            empresaId: { not: id }
          }
        });

        if (outrosVinculos === 0 && !this.hasFullGroupAccess(vinculo.usuario.grupo)) {
          usuariosParaRemover.push(vinculo.usuarioId);
        }
      }

      await tx.empresaUsuario.deleteMany({ where: { empresaId: id } });
      await tx.empresa.delete({ where: { id } });

      if (usuariosParaRemover.length) {
        await tx.usuario.deleteMany({
          where: {
            id: { in: usuariosParaRemover }
          }
        });
      }
    });

    return true;
  }

  async userBelongsToCompany(usuarioId: string, empresaId: number): Promise<boolean> {
    const vinculo = await this.prisma.empresaUsuario.findFirst({
      where: {
        empresaId,
        usuarioId
      }
    });

    return !!vinculo;
  }

  async toEmpresaType(empresa: EmpresaRecord): Promise<EmpresaType> {
    const [access, solucoes] = await Promise.all([
      this.solucoesService.findCompanyAccess(empresa.id),
      this.solucoesService.findCompanySolutionSummaries(empresa.id)
    ]);

    return {
      id: empresa.id,
      nome: empresa.nome ?? null,
      acessoEcommerce: empresa.acessoEcommerce ?? false,
      acessoProjetos: empresa.acessoProjetos ?? false,
      acessoHoras: empresa.acessoHoras ?? false,
      solucaoIds: access.solucaoIds,
      solucaoSlugs: solucoes.map((solucao) => solucao.slug),
      solucaoNomes: solucoes.map((solucao) => solucao.nome),
      funcionalidadeIds: access.funcionalidadeIds
    };
  }

  private assertAdmin(user: JwtPayload, action: string): void {
    if (user.login?.toLowerCase() !== 'admin') {
      throw new ForbiddenException(`Apenas o usuario administrador inicial pode ${action}.`);
    }
  }

  private async resolveFuncionalidadeIds(solucaoIds: number[] = [], funcionalidadeIds?: number[]): Promise<number[]> {
    if (funcionalidadeIds?.length) {
      return funcionalidadeIds;
    }

    if (!solucaoIds.length) {
      return [];
    }

    const solucoes = await this.solucoesService.findAll();

    return solucoes
      .filter((solucao) => solucaoIds.includes(solucao.id))
      .flatMap((solucao) => solucao.funcionalidades.map((funcionalidade) => funcionalidade.id));
  }

  private async ensureAdminLinkedToAllCompanies(): Promise<void> {
    const admins = await this.prisma.usuario.findMany({
      where: {
        login: 'admin'
      } as never,
      select: { id: true }
    });

    if (!admins.length) {
      return;
    }

    const empresas = await this.prisma.empresa.findMany({ select: { id: true } });

    if (!empresas.length) {
      return;
    }

    const adminIds = admins.map((admin) => admin.id);
    const vinculos = await this.prisma.empresaUsuario.findMany({
      where: { usuarioId: { in: adminIds } },
      select: { empresaId: true, usuarioId: true }
    });
    const linkedKeys = new Set(vinculos.map((vinculo) => `${vinculo.usuarioId}:${vinculo.empresaId}`));
    const missingLinks = adminIds.flatMap((usuarioId) =>
      empresas
        .map((empresa) => empresa.id)
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
