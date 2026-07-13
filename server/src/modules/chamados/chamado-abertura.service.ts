import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { FEATURES } from './constants/chamado.constants';
import { chamadoSummaryInclude } from './constants/chamado-prisma.constants';
import { CriarChamadoInput } from './dto/criar-chamado.input';
import { usuarioLabel } from './mappers/chamado.mapper';
import { ChamadoAcompanhanteService } from './chamado-acompanhante.service';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { ChamadoConfiguracaoService } from './chamado-configuracao.service';
import { ChamadoResponsavelService } from './chamado-responsavel.service';
import { ChamadoRecord } from './types/chamado-record.types';

@Injectable()
export class ChamadoAberturaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: ChamadoAuthorizationService,
    private readonly chamadoConfiguracao: ChamadoConfiguracaoService,
    private readonly chamadoResponsavel: ChamadoResponsavelService,
    private readonly chamadoAcompanhante: ChamadoAcompanhanteService
  ) {}

  async criarChamado(input: CriarChamadoInput, user: JwtPayload): Promise<string> {
    const empresaId = this.authorization.assertCompanyContext(user);
    await this.authorization.assertFeatureAction(user, FEATURES.abrir, 'incluir');
    await this.chamadoConfiguracao.ensureDefaultChamadoConfiguracoes(empresaId);

    const tipo = await this.chamadoConfiguracao.ensureTipoChamado(empresaId, input.tipoId);
    const prioridade = await this.chamadoConfiguracao.ensurePrioridadeChamado(empresaId, input.prioridadeId);
    const titulo = this.requiredText(input.titulo, 'titulo');
    const descricao = this.requiredText(input.descricao, 'descricao');
    const contexto = await this.chamadoResponsavel.resolveChamadoContext(input.solucaoId, input.funcionalidadeId ?? null);
    const responsavelAbertura = await this.chamadoResponsavel.resolveResponsavelAbertura(
      empresaId,
      contexto.solucaoId,
      contexto.funcionalidadeId,
      input.responsavelId ?? null,
      input.responsavelGrupoId ?? null
    );
    const acompanhantesAbertura = await this.chamadoAcompanhante.resolveAcompanhantesPayload(
      empresaId,
      input.acompanhanteIds ?? [],
      {
        solicitanteId: user.sub,
        responsavelId: responsavelAbertura.responsavelId
      }
    );

    if (input.categoriaId) {
      await this.chamadoConfiguracao.ensureCategoria(input.categoriaId, empresaId, true);
    }

    const created = (await this.prisma.$transaction(async (tx) => {
      const db = tx as never as {
        chamadoSequencia: { upsert: Function };
        chamado: { create: Function };
        chamadoHistorico: { create: Function };
        chamadoAcompanhante: { createMany: Function };
      };
      const sequencia = (await db.chamadoSequencia.upsert({
        where: { empresaId },
        update: { proximoNumero: { increment: 1 } },
        create: { empresaId, proximoNumero: 2 }
      })) as { proximoNumero: number };
      const numero = sequencia.proximoNumero - 1;
      const chamado = (await db.chamado.create({
        data: {
          numero,
          empresaId,
          solicitanteId: user.sub,
          categoriaId: input.categoriaId ?? null,
          solucaoId: contexto.solucaoId,
          funcionalidadeId: contexto.funcionalidadeId,
          responsavelId: responsavelAbertura.responsavelId,
          responsavelGrupoId: responsavelAbertura.responsavelGrupoId,
          titulo,
          descricao,
          tipoId: tipo.id,
          prioridadeId: prioridade.id,
          status: 'ABERTO'
        },
        include: chamadoSummaryInclude
      })) as ChamadoRecord;

      await db.chamadoHistorico.create({
        data: {
          chamadoId: chamado.id,
          empresaId,
          usuarioId: user.sub,
          evento: 'ABERTURA',
          campo: 'status',
          valorNovo: 'ABERTO',
          observacao: responsavelAbertura.responsavelId || responsavelAbertura.responsavelGrupoId ? 'Chamado aberto pelo solicitante com responsavel selecionado.' : 'Chamado aberto pelo solicitante.'
        }
      });

      if (acompanhantesAbertura.length) {
        await db.chamadoAcompanhante.createMany({
          data: acompanhantesAbertura.map((acompanhante) => ({
            chamadoId: chamado.id,
            empresaId,
            usuarioId: acompanhante.id,
            adicionadoPorId: user.sub,
            ativo: true
          }))
        });

        await db.chamadoHistorico.create({
          data: {
            chamadoId: chamado.id,
            empresaId,
            usuarioId: user.sub,
            evento: 'ACOMPANHANTES',
            campo: 'acompanhantes',
            valorNovo: acompanhantesAbertura.map((acompanhante) => usuarioLabel(acompanhante)).filter(Boolean).join(', '),
            observacao: 'Acompanhantes adicionados na abertura do chamado.'
          }
        });
      }

      return chamado;
    })) as ChamadoRecord;

    return created.id;
  }

  private requiredText(value: string, fieldName: string): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new BadRequestException(`Preencha ${fieldName}.`);
    }

    return normalized;
  }
}
