import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateEmpresaInput } from './dto/create-empresa.input';
import { EmpresaType } from './dto/empresa.type';
import { UpdateEmpresaInput } from './dto/update-empresa.input';
import { EmpresaAcessoService } from './empresa-acesso.service';
import { EmpresaAdminService } from './empresa-admin.service';
import { toEmpresaType } from './mappers/empresa.mapper';
import { assertAdmin, assertCanRemoveEmpresa, hasFullGroupAccess } from './policies/empresa.policy';
import { EmpresaRecord } from './types/empresa-record.types';

@Injectable()
export class EmpresaCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresaAcesso: EmpresaAcessoService,
    private readonly empresaAdmin: EmpresaAdminService
  ) {}

  async create(input: CreateEmpresaInput, admin: JwtPayload): Promise<EmpresaType> {
    assertAdmin(admin, 'cadastrar empresas');

    const empresa = (await this.prisma.$transaction(async (tx) => {
      const systemAdminIds = await this.empresaAdmin.findSystemAdminIds();
      const createdEmpresa = await tx.empresa.create({
        data: {
          nome: input.nome ?? null,
          acessoEcommerce: input.acessoEcommerce ?? false,
          acessoProjetos: input.acessoProjetos ?? false,
          acessoHoras: input.acessoHoras ?? false
        }
      });

      if (systemAdminIds.length) {
        await tx.empresaUsuario.createMany({
          data: systemAdminIds.map((usuarioId) => ({
            empresaId: createdEmpresa.id,
            usuarioId
          }))
        });
      }

      return createdEmpresa;
    })) as EmpresaRecord;

    await this.empresaAcesso.syncCompanyAccess(empresa.id, input.solucaoIds ?? [], input.funcionalidadeIds);
    await this.empresaAcesso.ensureDefaultChamadoConfiguracoes(empresa.id);

    return this.toEmpresaType(empresa);
  }

  async findAll(): Promise<EmpresaType[]> {
    await this.empresaAdmin.ensureAdminLinkedToAllCompanies();

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
    await this.empresaAdmin.ensureAdminLinkedToAllCompanies();

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
    assertAdmin(admin, 'alterar empresas');

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
      await this.empresaAcesso.syncCompanyAccess(input.id, input.solucaoIds ?? [], input.funcionalidadeIds);
      await this.empresaAcesso.ensureDefaultChamadoConfiguracoes(input.id);
    }

    return this.toEmpresaType(empresa);
  }

  async remove(id: number, admin: JwtPayload): Promise<boolean> {
    assertAdmin(admin, 'remover empresas');

    const empresa = await this.findById(id);
    assertCanRemoveEmpresa(empresa);

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

        if (outrosVinculos === 0 && !hasFullGroupAccess(vinculo.usuario.grupo)) {
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

  async toEmpresaType(empresa: EmpresaRecord): Promise<EmpresaType> {
    const [access, solucoes] = await Promise.all([
      this.empresaAcesso.findCompanyAccess(empresa.id),
      this.empresaAcesso.findCompanySolutionSummaries(empresa.id)
    ]);

    return toEmpresaType(empresa, access, solucoes);
  }
}
