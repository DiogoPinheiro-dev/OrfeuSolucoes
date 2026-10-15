export type ConfiguracaoChamadoInicial = {
  nome: string;
  cor: string;
  ordem: number;
};

export const DADOS_INICIAIS_PRODUTO = {
  empresa: {
    nome: 'Empresa Teste',
    acessoEcommerce: false,
    acessoProjetos: false,
    acessoHoras: false,
    padraoSistema: true
  },
  grupoAdministradores: {
    nome: 'Administradores',
    descricao: 'Grupo inicial com acesso a todas as soluções.',
    acessoEcommerce: true,
    acessoProjetos: true,
    acessoHoras: true,
    acessoConfigurador: true,
    podeVisualizar: true,
    podeIncluir: true,
    podeAlterar: true,
    podeExcluir: true,
    padraoSistema: true
  },
  usuarioAdministrador: {
    nome: 'Administrador',
    login: 'admin',
    email: 'admin@admin.com',
    deveAlterarSenha: true,
    padraoSistema: true
  },
  chamados: {
    tipos: [
      { nome: 'Solicitação', cor: '#ea580c', ordem: 10 },
      { nome: 'Incidente', cor: '#dc2626', ordem: 20 },
      { nome: 'Dúvida', cor: '#16a34a', ordem: 30 },
      { nome: 'Melhoria', cor: '#f59e0b', ordem: 40 }
    ] as ConfiguracaoChamadoInicial[],
    prioridades: [
      { nome: 'Baixa', cor: '#16a34a', ordem: 10 },
      { nome: 'Média', cor: '#f59e0b', ordem: 20 },
      { nome: 'Alta', cor: '#ea580c', ordem: 30 },
      { nome: 'Urgente', cor: '#dc2626', ordem: 40 }
    ] as ConfiguracaoChamadoInicial[]
  }
};
