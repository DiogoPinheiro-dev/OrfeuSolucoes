import { Injectable } from '@nestjs/common';
import { Empresa, EmpresaUsuario } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UsuarioWithRole } from './types/user-record.types';

@Injectable()
export class UserEmpresaService {
  constructor(private readonly prisma: PrismaService) {}

  async attachEmpresas(user: UsuarioWithRole): Promise<UsuarioWithRole> {
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

  async findEmpresasByUsuarioIds(usuarioIds: string[]): Promise<Map<string, Empresa[]>> {
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

  async findAllEmpresaIds(): Promise<number[]> {
    const empresas = await this.prisma.empresa.findMany({
      select: { id: true }
    });

    return empresas.map((empresa) => empresa.id);
  }

  async ensureAdminLinkedToAllCompanies(): Promise<void> {
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
}
