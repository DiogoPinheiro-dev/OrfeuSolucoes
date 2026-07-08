import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { CreateEmpresaInput } from './dto/create-empresa.input';
import { EmpresaType } from './dto/empresa.type';
import { UpdateEmpresaInput } from './dto/update-empresa.input';
import { EmpresaCatalogService } from './empresa-catalog.service';
import { EmpresaRecord } from './types/empresa-record.types';

@Injectable()
export class EmpresasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresaCatalog: EmpresaCatalogService
  ) {}

  create(input: CreateEmpresaInput, admin: JwtPayload): Promise<EmpresaType> {
    return this.empresaCatalog.create(input, admin);
  }

  findAll(): Promise<EmpresaType[]> {
    return this.empresaCatalog.findAll();
  }

  findById(id: number): Promise<EmpresaRecord> {
    return this.empresaCatalog.findById(id);
  }

  findByUserId(usuarioId: string): Promise<EmpresaType[]> {
    return this.empresaCatalog.findByUserId(usuarioId);
  }

  update(input: UpdateEmpresaInput, admin: JwtPayload): Promise<EmpresaType> {
    return this.empresaCatalog.update(input, admin);
  }

  remove(id: number, admin: JwtPayload): Promise<boolean> {
    return this.empresaCatalog.remove(id, admin);
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

  toEmpresaType(empresa: EmpresaRecord): Promise<EmpresaType> {
    return this.empresaCatalog.toEmpresaType(empresa);
  }
}