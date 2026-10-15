import { CatalogoInstalacaoOperations } from './catalogo-instalacao.operations';
import { CATALOGO_PRODUTO } from './manifesto/catalogo-produto';

type Registro = Record<string, any>;
type Tabela = 'solucao' | 'funcionalidade' | 'funcionalidadeAcao' | 'funcionalidadeAgrupamento' | 'catalogoVersao' | 'catalogoAuditoria';

function criarBanco() {
  const tabelas: Record<Tabela, Registro[]> = {
    solucao: [], funcionalidade: [], funcionalidadeAcao: [], funcionalidadeAgrupamento: [], catalogoVersao: [], catalogoAuditoria: []
  };
  let sequencia = 0;
  const criar = (tabela: Tabela) => jest.fn(async ({ data }: { data: Registro }) => {
    sequencia += 1;
    const registro = { id: sequencia, ...data };
    tabelas[tabela].push(registro);
    return registro;
  });
  const banco = {
    solucao: { create: criar('solucao') },
    funcionalidade: {
      create: criar('funcionalidade'),
      update: jest.fn(async ({ where, data }: { where: { id: number }; data: Registro }) => {
        const registro = tabelas.funcionalidade.find((item) => item.id === where.id) as Registro;
        Object.assign(registro, data);
        return registro;
      })
    },
    funcionalidadeAcao: { create: criar('funcionalidadeAcao') },
    funcionalidadeAgrupamento: { create: criar('funcionalidadeAgrupamento') },
    catalogoVersao: { create: criar('catalogoVersao') },
    catalogoAuditoria: { create: criar('catalogoAuditoria') }
  };
  return { banco, tabelas };
}

describe('CatalogoInstalacaoOperations', () => {
  const totais = {
    solucoes: CATALOGO_PRODUTO.solucoes.length,
    funcionalidades: CATALOGO_PRODUTO.solucoes.flatMap((solucao) => solucao.funcionalidades).length,
    acoes: CATALOGO_PRODUTO.solucoes.flatMap((solucao) => solucao.funcionalidades.flatMap((funcionalidade) => funcionalidade.acoes)).length,
    agrupamentos: CATALOGO_PRODUTO.solucoes.flatMap((solucao) => solucao.agrupamentos).length
  };

  it('cria exatamente o manifesto, publicado, com chaves técnicas estáveis', async () => {
    const { banco, tabelas } = criarBanco();
    const publicadoEm = new Date('2026-10-15T12:00:00Z');

    const instalado = await new CatalogoInstalacaoOperations().criarCatalogo(banco as never, publicadoEm);

    expect(totais).toEqual({ solucoes: 4, funcionalidades: 28, acoes: 146, agrupamentos: 7 });
    expect(instalado.solucoes).toHaveLength(totais.solucoes);
    expect(instalado.funcionalidades).toHaveLength(totais.funcionalidades);
    expect(instalado.acoes).toHaveLength(totais.acoes);
    expect(tabelas.funcionalidadeAgrupamento).toHaveLength(totais.agrupamentos);

    for (const item of [...tabelas.solucao, ...tabelas.funcionalidade, ...tabelas.funcionalidadeAcao]) {
      expect(item).toMatchObject({ statusPublicacao: 'PUBLICADA', publicadoEm, versaoDefinicao: CATALOGO_PRODUTO.versao });
    }
    expect(tabelas.solucao.map((item) => item.chaveTecnica)).toEqual(CATALOGO_PRODUTO.solucoes.map((item) => `solucao.${item.slug}`));
    for (const funcionalidade of tabelas.funcionalidade) {
      expect(funcionalidade.chaveTecnica).toBe(funcionalidade.registryKey);
      expect(funcionalidade.padraoSistema).toBe(true);
    }
    expect(tabelas.funcionalidadeAgrupamento.map((item) => item.chaveTecnica)).toContain('agrupamento.projetos.controle-de-horas');
  });

  it('registra a versão 1 de cada item com a base igual ao manifesto e o evento de instalação', async () => {
    const { banco, tabelas } = criarBanco();

    await new CatalogoInstalacaoOperations().criarCatalogo(banco as never, new Date());

    const itens = totais.solucoes + totais.funcionalidades + totais.acoes;
    expect(tabelas.catalogoVersao).toHaveLength(itens);
    expect(tabelas.catalogoAuditoria).toHaveLength(itens);
    for (const versao of tabelas.catalogoVersao) {
      expect(versao).toMatchObject({ numero: 1, estado: 'PUBLICADA', origem: 'PRODUTO', revisao: 1 });
      expect(versao.baselineSnapshot).toBe(versao.snapshot);
    }
    expect(new Set(tabelas.catalogoAuditoria.map((item) => item.evento))).toEqual(new Set(['INSTALACAO_REGISTRADA']));
  });

  it('associa as abas de cada agrupamento na ordem do manifesto', async () => {
    const { banco, tabelas } = criarBanco();

    await new CatalogoInstalacaoOperations().criarCatalogo(banco as never, new Date());

    const projetos = tabelas.solucao.find((item) => item.slug === 'projetos') as Registro;
    const horas = tabelas.funcionalidadeAgrupamento.find((item) => item.solucaoId === projetos.id && item.slug === 'controle-de-horas') as Registro;
    const abas = tabelas.funcionalidade
      .filter((item) => item.agrupamentoId === horas.id)
      .sort((esquerda, direita) => esquerda.ordemNoAgrupamento - direita.ordemNoAgrupamento)
      .map((item) => item.slug);
    expect(abas).toEqual(['meus-apontamentos', 'horas-do-projeto']);
  });
});
