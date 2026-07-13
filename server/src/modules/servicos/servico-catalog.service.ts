import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServicoInput } from './dto/create-servico.input';
import { ServicoType } from './dto/servico.type';
import { UpdateServicoInput } from './dto/update-servico.input';
import { toServicoType } from './mappers/servico.mapper';

@Injectable()
export class ServicoCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateServicoInput): Promise<ServicoType> {
    const servico = await this.prisma.servico.create({
      data: {
        titulo: input.titulo,
        descricao: input.descricao,
        valor: input.valor,
        desconto: input.desconto,
        vendas: input.vendas
      }
    });

    return toServicoType(servico);
  }

  async findAll(): Promise<ServicoType[]> {
    const servicos = await this.prisma.servico.findMany({
      orderBy: { id: 'desc' }
    });

    return servicos.map((servico) => toServicoType(servico));
  }

  async update(input: UpdateServicoInput): Promise<ServicoType> {
    await this.ensureServicoExists(input.id);

    const servico = await this.prisma.servico.update({
      where: { id: input.id },
      data: {
        titulo: input.titulo,
        descricao: input.descricao,
        valor: input.valor,
        desconto: input.desconto,
        vendas: input.vendas
      }
    });

    return toServicoType(servico);
  }

  async remove(id: number): Promise<boolean> {
    await this.ensureServicoExists(id);

    await this.prisma.servico.delete({
      where: { id }
    });

    return true;
  }

  private async ensureServicoExists(id: number): Promise<void> {
    const servico = await this.prisma.servico.findUnique({ where: { id } });

    if (!servico) {
      throw new NotFoundException('Servico nao encontrado.');
    }
  }
}
