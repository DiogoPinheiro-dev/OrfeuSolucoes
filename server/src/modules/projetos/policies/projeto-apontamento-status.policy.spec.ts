import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProjetoSituacao } from '../types/projeto.types';
import { ProjetoApontamentoOperacao, ProjetoApontamentoStatus } from '../types/projeto-apontamento.types';
import {
  ProjetoApontamentoSituacaoDoAutor,
  ProjetoApontamentoTransicao,
  permiteProjetoApontamentoTransicao,
  resolveProjetoApontamentoAcoesDoAutor,
  resolveProjetoApontamentoTransicao
} from './projeto-apontamento-status.policy';

const { SALVAR, EXCLUIR, DESCARTAR, ENVIAR, RECOLHER, APROVAR, REJEITAR, REABRIR } = ProjetoApontamentoOperacao;
const { RASCUNHO, ENVIADO, APROVADO, REJEITADO } = ProjetoApontamentoStatus;

const transicao = (dados: Partial<ProjetoApontamentoTransicao>): ProjetoApontamentoTransicao => ({
  operacao: SALVAR,
  status: null,
  descartado: false,
  atorEhAutor: true,
  situacaoProjeto: ProjetoSituacao.EM_ANDAMENTO,
  competenciaFechada: false,
  ...dados
});

const situacaoDoAutor = (dados: Partial<ProjetoApontamentoSituacaoDoAutor>): ProjetoApontamentoSituacaoDoAutor => ({
  status: RASCUNHO,
  competencia: '2026-10',
  competenciaFechada: false,
  situacaoProjeto: ProjetoSituacao.EM_ANDAMENTO,
  projetoArquivado: false,
  lancaNoProjeto: true,
  podeAlterar: true,
  podeExcluir: true,
  ...dados
});

const nenhumaAcao = { podeAlterar: false, podeExcluir: false, podeDescartar: false, podeEnviar: false, podeRecolher: false };

describe('ProjetoApontamentoStatusPolicy', () => {
  it('cria em rascunho e preserva rascunho ou rejeitado ao salvar', () => {
    expect(resolveProjetoApontamentoTransicao(transicao({ status: null }))).toBe(RASCUNHO);
    expect(resolveProjetoApontamentoTransicao(transicao({ status: RASCUNHO }))).toBe(RASCUNHO);
    expect(resolveProjetoApontamentoTransicao(transicao({ status: REJEITADO }))).toBe(REJEITADO);
  });

  it.each([
    [ENVIAR, RASCUNHO, true, ENVIADO],
    [ENVIAR, REJEITADO, true, ENVIADO],
    [RECOLHER, ENVIADO, true, RASCUNHO],
    [APROVAR, ENVIADO, false, APROVADO],
    [REJEITAR, ENVIADO, false, REJEITADO],
    [REABRIR, APROVADO, false, RASCUNHO],
    [REABRIR, APROVADO, true, RASCUNHO],
    [DESCARTAR, REJEITADO, true, REJEITADO],
    [EXCLUIR, RASCUNHO, true, null]
  ])('%s a partir de %s resulta na situacao esperada', (operacao, status, atorEhAutor, esperado) => {
    expect(resolveProjetoApontamentoTransicao(transicao({ operacao, status, atorEhAutor }))).toBe(esperado);
  });

  it.each([
    [SALVAR, ENVIADO, 'Não é possível salvar um apontamento enviado.'],
    [SALVAR, APROVADO, 'Não é possível salvar um apontamento aprovado.'],
    [EXCLUIR, ENVIADO, 'Não é possível excluir um apontamento enviado.'],
    [DESCARTAR, RASCUNHO, 'Não é possível descartar um apontamento em rascunho.'],
    [ENVIAR, ENVIADO, 'Não é possível enviar um apontamento enviado.'],
    [ENVIAR, null, 'Não é possível enviar um apontamento que ainda não foi salvo.'],
    [RECOLHER, APROVADO, 'Não é possível recolher um apontamento aprovado.'],
    [REABRIR, ENVIADO, 'Não é possível reabrir um apontamento enviado.']
  ])('rejeita %s a partir de %s', (operacao, status, mensagem) => {
    expect(() => resolveProjetoApontamentoTransicao(transicao({ operacao, status }))).toThrow(
      new BadRequestException(mensagem)
    );
  });

  it.each([
    [APROVAR, ENVIADO],
    [REJEITAR, ENVIADO]
  ])('rejeita %s quando o ator e o autor', (operacao, status) => {
    expect(() => resolveProjetoApontamentoTransicao(transicao({ operacao, status, atorEhAutor: true }))).toThrow(
      ForbiddenException
    );
  });

  it.each([
    [SALVAR, RASCUNHO],
    [EXCLUIR, RASCUNHO],
    [DESCARTAR, REJEITADO],
    [ENVIAR, RASCUNHO],
    [RECOLHER, ENVIADO]
  ])('reserva %s ao autor', (operacao, status) => {
    expect(() => resolveProjetoApontamentoTransicao(transicao({ operacao, status, atorEhAutor: false }))).toThrow(
      new ForbiddenException(`Somente o autor pode ${operacao.toLowerCase()} o apontamento.`)
    );
  });

  it.each([ProjetoSituacao.EM_ORCAMENTO, ProjetoSituacao.PAUSADO, ProjetoSituacao.CONCLUIDO, ProjetoSituacao.CANCELADO])(
    'congela lancamento, envio, recolhimento e reabertura no ciclo %s',
    (situacaoProjeto) => {
      for (const [operacao, status] of [[SALVAR, null], [ENVIAR, RASCUNHO], [RECOLHER, ENVIADO], [REABRIR, APROVADO]] as const) {
        expect(() =>
          resolveProjetoApontamentoTransicao(transicao({ operacao, status, situacaoProjeto, atorEhAutor: operacao !== REABRIR }))
        ).toThrow('o projeto precisa estar em Rascunho, Planejado ou Em andamento');
      }
    }
  );

  it.each([ProjetoSituacao.PAUSADO, ProjetoSituacao.CONCLUIDO, ProjetoSituacao.CANCELADO])(
    'decide enviados, exclui rascunhos e descarta rejeitados no ciclo %s',
    (situacaoProjeto) => {
      expect(resolveProjetoApontamentoTransicao(transicao({ operacao: APROVAR, status: ENVIADO, atorEhAutor: false, situacaoProjeto }))).toBe(APROVADO);
      expect(resolveProjetoApontamentoTransicao(transicao({ operacao: REJEITAR, status: ENVIADO, atorEhAutor: false, situacaoProjeto }))).toBe(REJEITADO);
      expect(resolveProjetoApontamentoTransicao(transicao({ operacao: EXCLUIR, status: RASCUNHO, situacaoProjeto }))).toBeNull();
      expect(resolveProjetoApontamentoTransicao(transicao({ operacao: DESCARTAR, status: REJEITADO, situacaoProjeto }))).toBe(REJEITADO);
    }
  );

  it.each([ProjetoSituacao.RASCUNHO, ProjetoSituacao.PLANEJADO, ProjetoSituacao.EM_ANDAMENTO])(
    'aceita lancamento no ciclo %s',
    (situacaoProjeto) => {
      expect(resolveProjetoApontamentoTransicao(transicao({ situacaoProjeto }))).toBe(RASCUNHO);
    }
  );

  it.each([
    [SALVAR, RASCUNHO, true],
    [EXCLUIR, RASCUNHO, true],
    [DESCARTAR, REJEITADO, true],
    [ENVIAR, RASCUNHO, true],
    [RECOLHER, ENVIADO, true],
    [APROVAR, ENVIADO, false],
    [REABRIR, APROVADO, false]
  ])('bloqueia %s em competencia fechada', (operacao, status, atorEhAutor) => {
    expect(() =>
      resolveProjetoApontamentoTransicao(transicao({ operacao, status, atorEhAutor, competenciaFechada: true }))
    ).toThrow('A competência deste apontamento está fechada.');
  });

  it('nao bloqueia a rejeicao por competencia, porque o fechamento exige nenhum enviado pendente', () => {
    expect(
      resolveProjetoApontamentoTransicao(transicao({ operacao: REJEITAR, status: ENVIADO, atorEhAutor: false, competenciaFechada: true }))
    ).toBe(REJEITADO);
  });

  it('mantem o apontamento descartado somente para consulta', () => {
    for (const operacao of Object.values(ProjetoApontamentoOperacao)) {
      expect(() => resolveProjetoApontamentoTransicao(transicao({ operacao, status: REJEITADO, descartado: true }))).toThrow(
        'O apontamento descartado está disponível somente para consulta.'
      );
    }
  });

  it('responde se a transicao e permitida sem lancar a recusa', () => {
    expect(permiteProjetoApontamentoTransicao(transicao({ operacao: ENVIAR, status: RASCUNHO }))).toBe(true);
    expect(permiteProjetoApontamentoTransicao(transicao({ operacao: ENVIAR, status: APROVADO }))).toBe(false);
    expect(permiteProjetoApontamentoTransicao(transicao({ operacao: APROVAR, status: ENVIADO, atorEhAutor: true }))).toBe(false);
  });

  it.each([
    [RASCUNHO, { podeAlterar: true, podeExcluir: true, podeEnviar: true }],
    [REJEITADO, { podeAlterar: true, podeDescartar: true, podeEnviar: true }],
    [ENVIADO, { podeRecolher: true }],
    [APROVADO, {}]
  ] as const)('oferece ao autor as acoes da tabela para um apontamento %s', (status, permitidas) => {
    expect(resolveProjetoApontamentoAcoesDoAutor(situacaoDoAutor({ status }))).toEqual({
      ...nenhumaAcao,
      ...permitidas,
      bloqueio: null
    });
  });

  it('respeita as acoes alterar e excluir de Meus apontamentos', () => {
    expect(resolveProjetoApontamentoAcoesDoAutor(situacaoDoAutor({ podeAlterar: false }))).toEqual({
      ...nenhumaAcao,
      podeExcluir: true,
      bloqueio: null
    });
    expect(resolveProjetoApontamentoAcoesDoAutor(situacaoDoAutor({ status: REJEITADO, podeExcluir: false }))).toEqual({
      ...nenhumaAcao,
      podeAlterar: true,
      podeEnviar: true,
      bloqueio: null
    });
  });

  it.each([
    [{ projetoArquivado: true }, 'O projeto está arquivado, e o apontamento fica somente para consulta.'],
    [{ lancaNoProjeto: false }, 'Você não participa mais deste projeto como responsável ou membro, e o apontamento fica somente para consulta.'],
    [{ competenciaFechada: true }, 'A competência 10/2026 deste projeto está fechada.']
  ] as const)('deixa o apontamento somente para consulta e explica o motivo', (dados, bloqueio) => {
    expect(resolveProjetoApontamentoAcoesDoAutor(situacaoDoAutor({ status: REJEITADO, ...dados }))).toEqual({ ...nenhumaAcao, bloqueio });
  });

  it('fora dos ciclos elegiveis, ainda exclui rascunhos e descarta rejeitados e explica o congelamento', () => {
    const congelamento = 'O projeto não está em Rascunho, Planejado ou Em andamento, então o apontamento não pode ser alterado, enviado nem recolhido.';
    const situacaoProjeto = ProjetoSituacao.PAUSADO;

    expect(resolveProjetoApontamentoAcoesDoAutor(situacaoDoAutor({ situacaoProjeto }))).toEqual({
      ...nenhumaAcao, podeExcluir: true, bloqueio: congelamento
    });
    expect(resolveProjetoApontamentoAcoesDoAutor(situacaoDoAutor({ status: REJEITADO, situacaoProjeto }))).toEqual({
      ...nenhumaAcao, podeDescartar: true, bloqueio: congelamento
    });
    expect(resolveProjetoApontamentoAcoesDoAutor(situacaoDoAutor({ status: ENVIADO, situacaoProjeto }))).toEqual({
      ...nenhumaAcao, bloqueio: congelamento
    });
    expect(resolveProjetoApontamentoAcoesDoAutor(situacaoDoAutor({ status: APROVADO, situacaoProjeto }))).toEqual({
      ...nenhumaAcao, bloqueio: null
    });
  });
});
