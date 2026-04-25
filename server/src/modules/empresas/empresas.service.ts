import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateEmpresaInput } from './dto/create-empresa.input';
import { EmpresaType } from './dto/empresa.type';

export type EmpresaRecord = {
  id: number;
  nome?: string | null;
  acessoEcommerce?: boolean;
  acessoProjetos?: boolean;
  acessoHoras?: boolean;
};

@Injectable()
export class EmpresasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateEmpresaInput, admin: JwtPayload): Promise<EmpresaType> {
    if (admin.tipo !== 'ADMIN') {
      throw new ForbiddenException('Apenas administradores podem cadastrar empresas.');
    }

    const empresa = (await (this.prisma as any).empresa.create({
      data: {
        nome: input.nome ?? null,
        acessoEcommerce: input.acessoEcommerce ?? false,
        acessoProjetos: input.acessoProjetos ?? false,
        acessoHoras: input.acessoHoras ?? false,
        usuarios: {
          create: {
            usuarioId: admin.sub
          }
        }
      }
    })) as EmpresaRecord;

    return this.toEmpresaType(empresa);
  }

  async findAll(): Promise<EmpresaType[]> {
    const empresas = (await (this.prisma as any).empresa.findMany({
      orderBy: { nome: 'asc' }
    })) as EmpresaRecord[];

    return empresas.map((empresa) => this.toEmpresaType(empresa));
  }

  async findById(id: number): Promise<EmpresaRecord> {
    const empresa = (await (this.prisma as any).empresa.findUnique({
      where: { id }
    })) as EmpresaRecord | null;

    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    return empresa;
  }

  async userBelongsToCompany(usuarioId: string, empresaId: number): Promise<boolean> {
    const vinculo = await (this.prisma as any).empresaUsuario.findFirst({
      where: {
        empresaId,
        usuarioId
      }
    });

    return !!vinculo;
  }

  toEmpresaType(empresa: EmpresaRecord): EmpresaType {
    return {
      id: empresa.id,
      nome: empresa.nome ?? null,
      acessoEcommerce: empresa.acessoEcommerce ?? false,
      acessoProjetos: empresa.acessoProjetos ?? false,
      acessoHoras: empresa.acessoHoras ?? false
    };
  }
}
