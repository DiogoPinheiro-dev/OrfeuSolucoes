import {
  alteraAssociacaoAgrupamento,
  mesmaAssociacaoAgrupamento,
  resolverAssociacaoAgrupamento,
  restringirAgrupamentosVisiveis
} from './funcionalidade-agrupamento.policy';

describe('funcionalidade-agrupamento.policy', () => {
  describe('resolverAssociacaoAgrupamento', () => {
    const atual = { agrupamentoId: 3, ordemNoAgrupamento: 2 };

    it('preserva a associacao quando nada foi informado', () => {
      expect(resolverAssociacaoAgrupamento(atual, {})).toEqual(atual);
      expect(alteraAssociacaoAgrupamento({})).toBe(false);
    });

    it('limpa a ordem ao retirar a funcionalidade do agrupamento', () => {
      expect(resolverAssociacaoAgrupamento(atual, { agrupamentoId: null })).toEqual({ agrupamentoId: null, ordemNoAgrupamento: null });
    });

    it('altera somente a ordem dentro do agrupamento atual', () => {
      expect(resolverAssociacaoAgrupamento(atual, { ordemNoAgrupamento: 5 })).toEqual({ agrupamentoId: 3, ordemNoAgrupamento: 5 });
      expect(alteraAssociacaoAgrupamento({ ordemNoAgrupamento: 5 })).toBe(true);
    });

    it('ignora ordem quando a funcionalidade nao possui agrupamento', () => {
      expect(resolverAssociacaoAgrupamento({ agrupamentoId: null, ordemNoAgrupamento: null }, { ordemNoAgrupamento: 5 }))
        .toEqual({ agrupamentoId: null, ordemNoAgrupamento: null });
    });

    it('compara associacoes pelo agrupamento e pela ordem', () => {
      expect(mesmaAssociacaoAgrupamento(atual, { ...atual })).toBe(true);
      expect(mesmaAssociacaoAgrupamento(atual, { ...atual, ordemNoAgrupamento: 1 })).toBe(false);
    });
  });

  describe('restringirAgrupamentosVisiveis', () => {
    const agrupamentos = [
      { id: 1, ativo: true, titulo: 'Configurações' },
      { id: 2, ativo: false, titulo: 'Inativo' },
      { id: 3, ativo: true, titulo: 'Sem abas autorizadas' }
    ];

    it('mostra somente agrupamentos ativos com funcionalidade visivel e nunca acrescenta funcionalidades', () => {
      const funcionalidades = [
        { id: 10, agrupamentoId: 1, ordemNoAgrupamento: 1 },
        { id: 11, agrupamentoId: 2, ordemNoAgrupamento: 1 },
        { id: 12, agrupamentoId: null, ordemNoAgrupamento: null }
      ];

      const resultado = restringirAgrupamentosVisiveis(agrupamentos, funcionalidades);

      expect(resultado.agrupamentos.map((agrupamento) => agrupamento.id)).toEqual([1]);
      expect(resultado.funcionalidades.map((funcionalidade) => funcionalidade.id)).toEqual([10, 11, 12]);
      expect(resultado.funcionalidades[1]).toMatchObject({ agrupamentoId: null, ordemNoAgrupamento: null });
    });

    it('oculta o agrupamento quando o usuario nao ve nenhuma das suas funcionalidades', () => {
      expect(restringirAgrupamentosVisiveis(agrupamentos, [{ id: 12, agrupamentoId: null }]).agrupamentos).toEqual([]);
    });
  });
});
