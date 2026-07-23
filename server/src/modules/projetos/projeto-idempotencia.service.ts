import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';

type ProjetoIdempotenciaEscopo = {
  empresaId: number;
  projetoId: string;
  usuarioId: string;
  operacao: string;
  chave: string;
};

export type ProjetoIdempotenciaInicio =
  | { reutilizada: false; id: string }
  | { reutilizada: true; id: string; resposta: unknown };

@Injectable()
export class ProjetoIdempotenciaService {
  hash(payload: unknown): string {
    return createHash('sha256')
      .update(this.stableSerialize(payload))
      .digest('hex');
  }

  async iniciar(
    tx: Prisma.TransactionClient,
    escopo: ProjetoIdempotenciaEscopo,
    payload: unknown,
    expiraEm?: Date | null
  ): Promise<ProjetoIdempotenciaInicio> {
    const requisicaoHash = this.hash(payload);
    const where = {
      projetoId_usuarioId_operacao_chave: {
        projetoId: escopo.projetoId,
        usuarioId: escopo.usuarioId,
        operacao: escopo.operacao,
        chave: escopo.chave
      }
    };
    const existente = await tx.projetoOperacaoIdempotente.findUnique({ where });

    if (existente) {
      if (existente.requisicaoHash !== requisicaoHash) {
        throw new ConflictException(
          'A chave de idempotencia ja foi usada com outra requisicao.'
        );
      }

      if (existente.status === 'CONCLUIDA') {
        return {
          reutilizada: true,
          id: existente.id,
          resposta: existente.resposta
            ? JSON.parse(existente.resposta)
            : null
        };
      }

      if (existente.status === 'PROCESSANDO') {
        throw new ConflictException('Esta operacao ja esta em processamento.');
      }

      await tx.projetoOperacaoIdempotente.update({
        where: { id: existente.id },
        data: {
          status: 'PROCESSANDO',
          erro: null,
          expiraEm: expiraEm ?? null
        }
      });
      return { reutilizada: false, id: existente.id };
    }

    const criada = await tx.projetoOperacaoIdempotente.create({
      data: {
        ...escopo,
        requisicaoHash,
        status: 'PROCESSANDO',
        expiraEm: expiraEm ?? null
      }
    });

    return { reutilizada: false, id: criada.id };
  }

  async concluir(
    tx: Prisma.TransactionClient,
    id: string,
    resposta: unknown
  ): Promise<void> {
    await tx.projetoOperacaoIdempotente.update({
      where: { id },
      data: {
        status: 'CONCLUIDA',
        resposta: JSON.stringify(resposta),
        erro: null
      }
    });
  }

  async falhar(
    tx: Prisma.TransactionClient,
    id: string,
    erro: unknown
  ): Promise<void> {
    await tx.projetoOperacaoIdempotente.update({
      where: { id },
      data: {
        status: 'FALHOU',
        erro: erro instanceof Error ? erro.message : String(erro)
      }
    });
  }

  private stableSerialize(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value
        .map((item) => this.stableSerialize(item))
        .join(',')}]`;
    }

    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(
          ([key, item]) =>
            `${JSON.stringify(key)}:${this.stableSerialize(item)}`
        );
      return `{${entries.join(',')}}`;
    }

    return JSON.stringify(value) ?? 'null';
  }
}
