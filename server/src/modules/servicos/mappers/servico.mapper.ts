import { Servico } from '@prisma/client';
import { ServicoType } from '../dto/servico.type';

export function toServicoType(servico: Servico): ServicoType {
  return {
    id: servico.id,
    titulo: servico.titulo,
    descricao: servico.descricao,
    valor: servico.valor !== null ? Number(servico.valor) : null,
    desconto: servico.desconto !== null ? Number(servico.desconto) : null,
    vendas: servico.vendas
  };
}
