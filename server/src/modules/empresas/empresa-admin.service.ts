import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmpresaAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findSystemAdminIds(): Promise<string[]> {
    const admins = await this.prisma.usuario.findMany({
      where: {
        login: 'admin'
      } as never,
      select: { id: true }
    });

    return admins.map((admin) => admin.id);
  }

  async ensureAdminLinkedToAllCompanies(): Promise<void> {
    const adminIds = await this.findSystemAdminIds();

    if (!adminIds.length) {
      return;
    }

    const empresas = await this.prisma.empresa.findMany({ select: { id: true } });

    if (!empresas.length) {
      return;
    }

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
}
