import { CatalogoActionConsumerRegistry } from '../../solucoes/catalogo-action-consumer.registry';
import { CatalogoProviderRegistry } from '../../solucoes/catalogo-provider.registry';
import {
  RETIRED_FEATURE_KEYS,
  RETIRED_FEATURE_SLUGS,
  RETIRED_SOLUTION_SLUGS
} from '../../solucoes/constants/catalogo-retired-keys.constants';
import { CATALOGO_PRODUTO } from './catalogo-produto';

describe('CATALOGO_PRODUTO', () => {
  const funcionalidades = CATALOGO_PRODUTO.solucoes.flatMap((solucao) =>
    solucao.funcionalidades.map((funcionalidade) => ({ solucao, funcionalidade }))
  );

  it('mantém a versão 1 e identidades técnicas únicas', () => {
    expect(CATALOGO_PRODUTO.versao).toBe(1);

    const slugsSolucoes = CATALOGO_PRODUTO.solucoes.map((solucao) => solucao.slug);
    const registryKeys = funcionalidades.map(({ funcionalidade }) => funcionalidade.registryKey);

    expect(new Set(slugsSolucoes).size).toBe(slugsSolucoes.length);
    expect(new Set(registryKeys).size).toBe(registryKeys.length);

    for (const solucao of CATALOGO_PRODUTO.solucoes) {
      const slugs = solucao.funcionalidades.map((funcionalidade) => funcionalidade.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it('mantém toda tela ligada a um provider de código compatível', () => {
    const providers = new CatalogoProviderRegistry();

    for (const { funcionalidade } of funcionalidades) {
      expect(providers.isCompatible(
        funcionalidade.providerKey,
        funcionalidade.providerVersion
      )).toBe(true);
    }
  });

  it('mantém toda ação ligada a um consumidor de backend compatível', () => {
    const consumers = new CatalogoActionConsumerRegistry();

    for (const { funcionalidade } of funcionalidades) {
      for (const acao of funcionalidade.acoes) {
        expect(consumers.isCompatible(acao.configuracao ?? acao.chave, 1)).toBe(true);
      }
    }
  });

  it('não reintroduz soluções, funcionalidades ou providers aposentados', () => {
    for (const solucao of CATALOGO_PRODUTO.solucoes) {
      expect(RETIRED_SOLUTION_SLUGS.has(solucao.slug)).toBe(false);

      for (const funcionalidade of solucao.funcionalidades) {
        expect(RETIRED_FEATURE_SLUGS.has(`${solucao.slug}:${funcionalidade.slug}`)).toBe(false);
        expect(RETIRED_FEATURE_KEYS.has(funcionalidade.registryKey)).toBe(false);
        expect(RETIRED_FEATURE_KEYS.has(funcionalidade.providerKey)).toBe(false);
      }
    }
  });

  it('restringe cada agrupamento às funcionalidades da própria solução', () => {
    for (const solucao of CATALOGO_PRODUTO.solucoes) {
      const slugs = new Set(solucao.funcionalidades.map((funcionalidade) => funcionalidade.slug));
      const agrupamentoSlugs = solucao.agrupamentos.map((agrupamento) => agrupamento.slug);

      expect(new Set(agrupamentoSlugs).size).toBe(agrupamentoSlugs.length);
      for (const agrupamento of solucao.agrupamentos) {
        expect(agrupamento.funcionalidades.length).toBeGreaterThan(0);
        for (const funcionalidadeSlug of agrupamento.funcionalidades) {
          expect(slugs.has(funcionalidadeSlug)).toBe(true);
        }
      }
    }
  });
});
