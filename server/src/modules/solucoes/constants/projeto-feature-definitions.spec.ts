import { PROJETO_FEATURE_DEFINITIONS } from './projeto-feature-definitions';

describe('PROJETO_FEATURE_DEFINITIONS', () => {
  it('publica o controle de horas como duas funcionalidades administrativas no catálogo do produto', () => {
    const porSlug = new Map(PROJETO_FEATURE_DEFINITIONS.map((feature) => [feature.slug, feature]));
    const meusApontamentos = porSlug.get('meus-apontamentos');
    const horasDoProjeto = porSlug.get('horas-do-projeto');

    expect(meusApontamentos).toMatchObject({
      registryKey: 'projetos.meus-apontamentos',
      ativo: true,
      acessoInicial: 'SOMENTE_ADMINISTRADORES'
    });
    expect(meusApontamentos?.acoes).toBeUndefined();
    expect(horasDoProjeto).toMatchObject({
      registryKey: 'projetos.horas-do-projeto',
      ativo: true,
      acessoInicial: 'SOMENTE_ADMINISTRADORES'
    });
    expect(horasDoProjeto?.acoes?.map((acao) => acao.chave)).toEqual([
      'aprovar_horas',
      'reabrir_horas',
      'fechar_periodo'
    ]);
  });

  it('não recria funcionalidades retiradas do roteiro', () => {
    expect(PROJETO_FEATURE_DEFINITIONS.map((feature) => feature.slug)).not.toEqual(expect.arrayContaining([
      'templates-de-projeto',
      'portfolio-de-projetos'
    ]));
  });
});
