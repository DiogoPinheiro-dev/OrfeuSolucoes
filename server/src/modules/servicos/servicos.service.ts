import { Injectable, NotFoundException } from '@nestjs/common';
import { Servico } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServicoInput } from './dto/create-servico.input';
import { ServicoType } from './dto/servico.type';
import { UpdateServicoInput } from './dto/update-servico.input';

@Injectable()
export class ServicosService {
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

    return this.toServicoType(servico);
  }

  async findAll(): Promise<ServicoType[]> {
    const servicos = await this.prisma.servico.findMany({
      orderBy: { id: 'desc' }
    });

    return servicos.map((servico) => this.toServicoType(servico));
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

    return this.toServicoType(servico);
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
      throw new NotFoundException('Serviço não encontrado.');
    }
  }

  private toServicoType(servico: Servico): ServicoType {
    return {
      id: servico.id,
      titulo: servico.titulo,
      descricao: servico.descricao,
      valor: servico.valor !== null ? Number(servico.valor) : null,
      desconto: servico.desconto !== null ? Number(servico.desconto) : null,
      vendas: servico.vendas
    };
  }
}
