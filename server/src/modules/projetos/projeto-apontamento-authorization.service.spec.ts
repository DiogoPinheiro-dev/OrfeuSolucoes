import { ForbiddenException } from '@nestjs/common';
import { ProjetoAcao, ProjetoFuncionalidade } from './constants/projeto-operacional.constants';
import { ProjetoApontamentoAuthorizationService } from './projeto-apontamento-authorization.service';
import { ProjetoPapel } from './types/projeto.types';

describe('ProjetoApontamentoAuthorizationService', () => {
  const user = { sub: 'usuario-1', empresaId: 7 } as never;
  const criarServico = (assertFeatureActionAccess: jest.Mock) =>
    new ProjetoApontamentoAuthorizationService({} as never, { assertFeatureActionAccess } as never, {} as never);

  it('confere cada ação em Meus apontamentos e devolve as permissões do autor', async () => {
    const permitidas = new Set<string>([ProjetoAcao.INCLUIR, ProjetoAcao.EXCLUIR]);
    const assertFeatureActionAccess = jest.fn(async (_user: unknown, _funcionalidade: string, acao: string) => {
      if (!permitidas.has(acao)) throw new ForbiddenException('Usuario sem permissao para executar esta acao.');
      return 7;
    });

    await expect(criarServico(assertFeatureActionAccess).permissoesDoAutor(user))
      .resolves.toEqual({ podeIncluir: true, podeAlterar: false, podeExcluir: true });
    expect(assertFeatureActionAccess).toHaveBeenCalledWith(user, ProjetoFuncionalidade.MEUS_APONTAMENTOS, ProjetoAcao.ALTERAR);
  });

  it('nao transforma falhas inesperadas em permissao negada', async () => {
    const falha = new Error('Catálogo indisponível.');

    await expect(criarServico(jest.fn().mockRejectedValue(falha)).permissoesDoAutor(user)).rejects.toBe(falha);
  });

  it.each([
    [ProjetoPapel.RESPONSAVEL, true],
    [ProjetoPapel.MEMBRO, true],
    [ProjetoPapel.OBSERVADOR, false],
    [null, false]
  ])('o papel %s lanca horas: %s', (papel, esperado) => {
    expect(criarServico(jest.fn()).lancaHoras(papel)).toBe(esperado);
  });
});
