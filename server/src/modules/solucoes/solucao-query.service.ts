import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SolucaoType } from './dto/solucao.type';
import { toType } from './mappers/solucao.mapper';
import { SolucaoRecord } from './types/solucao-record.types';

@Injectable()
export class SolucaoQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SolucaoType[]> {
    const solucoes = (await (this.prisma as never as { solucao: { findMany: Function } }).solucao.findMany({
      include: {
        funcionalidades: {
          include: {
            acoes: { orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] }
          },
          orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }]
        }
      },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }]
    })) as SolucaoRecord[];

    return solucoes.map((solucao) => toType(solucao));
  }
}
