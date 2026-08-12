import { gql } from "@apollo/client";

export const GET_SERVICOS_QUERY = gql`
  query GetServicos {
    servicos {
      id
      titulo
      descricao
      valor
      desconto
      vendas
    }
  }
`;

export const CREATE_SERVICO_MUTATION = gql`
  mutation CreateServico($input: CreateServicoInput!) {
    createServico(input: $input) {
      id
      titulo
      descricao
      valor
      desconto
      vendas
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        nome
        login
        email
        podeVisualizar
        podeIncluir
        podeAlterar
        podeExcluir
        deveAlterarSenha
        padraoSistema
        availableSolutions
        grupo {
          id
          nome
          descricao
          acessoEcommerce
          acessoProjetos
          acessoHoras
          acessoConfigurador
          podeVisualizar
          podeIncluir
          podeAlterar
          podeExcluir
        }
        empresa {
          id
          nome
          acessoEcommerce
          acessoProjetos
          acessoHoras
        }
        empresas {
          id
          nome
          acessoEcommerce
          acessoProjetos
          acessoHoras
        }
      }
    }
  }
`;

export const LOGIN_COMPANIES_MUTATION = gql`
  mutation LoginCompanies($input: LoginCompaniesInput!) {
    loginCompanies(input: $input) {
      id
      nome
      acessoEcommerce
      acessoProjetos
      acessoHoras
      solucaoIds
      solucaoSlugs
      solucaoNomes
      funcionalidadeIds
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      accessToken
      user {
        id
        nome
        login
        email
        podeVisualizar
        podeIncluir
        podeAlterar
        podeExcluir
        deveAlterarSenha
        padraoSistema
        availableSolutions
        grupo {
          id
          nome
          descricao
          acessoEcommerce
          acessoProjetos
          acessoHoras
          acessoConfigurador
          podeVisualizar
          podeIncluir
          podeAlterar
          podeExcluir
        }
        empresa {
          id
          nome
          acessoEcommerce
          acessoProjetos
          acessoHoras
        }
        empresas {
          id
          nome
          acessoEcommerce
          acessoProjetos
          acessoHoras
        }
      }
    }
  }
`;

export const SWITCH_COMPANY_MUTATION = gql`
  mutation SwitchCompany($input: SwitchCompanyInput!) {
    switchCompany(input: $input) {
      accessToken
      user {
        id
        nome
        login
        email
        podeVisualizar
        podeIncluir
        podeAlterar
        podeExcluir
        deveAlterarSenha
        padraoSistema
        availableSolutions
        grupo {
          id
          nome
          descricao
          acessoEcommerce
          acessoProjetos
          acessoHoras
          acessoConfigurador
          podeVisualizar
          podeIncluir
          podeAlterar
          podeExcluir
        }
        empresa {
          id
          nome
          acessoEcommerce
          acessoProjetos
          acessoHoras
        }
        empresas {
          id
          nome
          acessoEcommerce
          acessoProjetos
          acessoHoras
        }
      }
    }
  }
`;

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      nome
      login
      email
      podeVisualizar
      podeIncluir
      podeAlterar
      podeExcluir
      deveAlterarSenha
        padraoSistema
      availableSolutions
      grupo {
        id
        nome
        descricao
        acessoEcommerce
        acessoProjetos
        acessoHoras
        acessoConfigurador
        podeVisualizar
        podeIncluir
        podeAlterar
        podeExcluir
      }
      empresas {
        id
        nome
        acessoEcommerce
        acessoProjetos
        acessoHoras
      }
    }
  }
`;

export const USERS_QUERY = gql`
  query Users {
    users {
      id
      nome
      login
      email
      podeVisualizar
      podeIncluir
      podeAlterar
      podeExcluir
      deveAlterarSenha
        padraoSistema
      availableSolutions
      grupo {
        id
        nome
        descricao
        acessoEcommerce
        acessoProjetos
        acessoHoras
        acessoConfigurador
        podeVisualizar
        podeIncluir
        podeAlterar
        podeExcluir
      }
      empresas {
        id
        nome
      }
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      nome
      login
      email
      podeVisualizar
      podeIncluir
      podeAlterar
      podeExcluir
      deveAlterarSenha
        padraoSistema
      availableSolutions
      grupo {
        id
        nome
        descricao
        acessoEcommerce
        acessoProjetos
        acessoHoras
        acessoConfigurador
        podeVisualizar
        podeIncluir
        podeAlterar
        podeExcluir
      }
      empresas {
        id
        nome
      }
    }
  }
`;

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: String!) {
    deleteUser(id: $id)
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      nome
      login
      email
      podeVisualizar
      podeIncluir
      podeAlterar
      podeExcluir
      deveAlterarSenha
        padraoSistema
      availableSolutions
      grupo {
        id
        nome
        descricao
        acessoEcommerce
        acessoProjetos
        acessoHoras
        acessoConfigurador
        podeVisualizar
        podeIncluir
        podeAlterar
        podeExcluir
      }
      empresa {
        id
        nome
        acessoEcommerce
        acessoProjetos
        acessoHoras
      }
      empresas {
        id
        nome
        acessoEcommerce
        acessoProjetos
        acessoHoras
      }
    }
  }
`;

export const EMPRESAS_QUERY = gql`
  query Empresas {
    empresas {
      id
      nome
      acessoEcommerce
      acessoProjetos
      acessoHoras
      padraoSistema
      solucaoIds
      solucaoSlugs
      solucaoNomes
      funcionalidadeIds
    }
  }
`;

export const CREATE_EMPRESA_MUTATION = gql`
  mutation CreateEmpresa($input: CreateEmpresaInput!) {
    createEmpresa(input: $input) {
      id
      nome
      acessoEcommerce
      acessoProjetos
      acessoHoras
      padraoSistema
      solucaoIds
      solucaoSlugs
      solucaoNomes
      funcionalidadeIds
    }
  }
`;

export const UPDATE_EMPRESA_MUTATION = gql`
  mutation UpdateEmpresa($input: UpdateEmpresaInput!) {
    updateEmpresa(input: $input) {
      id
      nome
      acessoEcommerce
      acessoProjetos
      acessoHoras
      padraoSistema
      solucaoIds
      solucaoSlugs
      solucaoNomes
      funcionalidadeIds
    }
  }
`;

export const DELETE_EMPRESA_MUTATION = gql`
  mutation DeleteEmpresa($id: Int!) {
    deleteEmpresa(id: $id)
  }
`;

export const GRUPOS_USUARIOS_QUERY = gql`
  query GruposUsuarios {
    gruposUsuarios {
      id
      nome
      descricao
      acessoEcommerce
      acessoProjetos
      acessoHoras
      acessoConfigurador
      padraoSistema
      podeVisualizar
      podeIncluir
      podeAlterar
      podeExcluir
      solucaoIds
      funcionalidadeIds
      funcionalidadePermissoes {
        funcionalidadeId
        podeVisualizar
        podeIncluir
        podeAlterar
        podeExcluir
        acoes {
          funcionalidadeId
          acaoId
          chave
          permitido
        }
      }
    }
  }
`;

export const CREATE_GRUPO_USUARIO_MUTATION = gql`
  mutation CreateGrupoUsuario($input: CreateGrupoUsuarioInput!) {
    createGrupoUsuario(input: $input) {
      id
      nome
      descricao
      acessoEcommerce
      acessoProjetos
      acessoHoras
      acessoConfigurador
      padraoSistema
      podeVisualizar
      podeIncluir
      podeAlterar
      podeExcluir
      solucaoIds
      funcionalidadeIds
      funcionalidadePermissoes {
        funcionalidadeId
        podeVisualizar
        podeIncluir
        podeAlterar
        podeExcluir
        acoes {
          funcionalidadeId
          acaoId
          chave
          permitido
        }
      }
    }
  }
`;

export const UPDATE_GRUPO_USUARIO_MUTATION = gql`
  mutation UpdateGrupoUsuario($input: UpdateGrupoUsuarioInput!) {
    updateGrupoUsuario(input: $input) {
      id
      nome
      descricao
      acessoEcommerce
      acessoProjetos
      acessoHoras
      acessoConfigurador
      padraoSistema
      podeVisualizar
      podeIncluir
      podeAlterar
      podeExcluir
      solucaoIds
      funcionalidadeIds
      funcionalidadePermissoes {
        funcionalidadeId
        podeVisualizar
        podeIncluir
        podeAlterar
        podeExcluir
        acoes {
          funcionalidadeId
          acaoId
          chave
          permitido
        }
      }
    }
  }
`;

export const DELETE_GRUPO_USUARIO_MUTATION = gql`
  mutation DeleteGrupoUsuario($id: Int!) {
    deleteGrupoUsuario(id: $id)
  }
`;

export const MY_HUB_NAVIGATION_QUERY = gql`
  query MyHubNavigation {
    myHubNavigation {
      id
      slug
      nome
      descricao
      eyebrow
      ordem
      ativo
      exibirNoHub
      somenteAdminSistema
      funcionalidades {
        id
        slug
        titulo
        label
        descricao
        ordem
        ativo
        registryKey
        somenteAdminSistema
        padraoSistema
        podeVisualizar
        podeIncluir
        podeAlterar
        podeExcluir
        acoes {
          id
          funcionalidadeId
          chave
          nome
          descricao
          ordem
          ativo
          acaoPadrao
          configuracao
          permitido
        }
      }
    }
  }
`;

export const DOCUMENTACAO_INDICE_QUERY = gql`
  query DocumentacaoIndice($filtro: DocumentacaoFiltroInput) {
    documentacaoIndice(filtro: $filtro) {
      id
      slug
      titulo
      resumo
      categoria
      audiencia
      ordem
      validadoEm
      palavrasChave
      solucao
      funcionalidade
      registryKey
    }
  }
`;

export const DOCUMENTACAO_ARTIGO_QUERY = gql`
  query DocumentacaoArtigo($slug: String!) {
    documentacaoArtigo(slug: $slug) {
      id
      slug
      titulo
      resumo
      categoria
      audiencia
      ordem
      validadoEm
      palavrasChave
      solucao
      funcionalidade
      registryKey
      conteudo
    }
  }
`;

export const BUSCAR_DOCUMENTACAO_QUERY = gql`
  query BuscarDocumentacao($termo: String!, $filtro: DocumentacaoFiltroInput) {
    buscarDocumentacao(termo: $termo, filtro: $filtro) {
      id
      slug
      titulo
      resumo
      categoria
      audiencia
      ordem
      validadoEm
      palavrasChave
      solucao
      funcionalidade
      registryKey
      trecho
    }
  }
`;

export const SOLUCOES_QUERY = gql`
  query Solucoes {
    solucoes {
      id
      slug
      nome
      descricao
      eyebrow
      ordem
      ativo
      exibirNoHub
      somenteAdminSistema
      funcionalidades {
        id
        slug
        titulo
        label
        descricao
        ordem
        ativo
        registryKey
        somenteAdminSistema
        padraoSistema
        podeVisualizar
        podeIncluir
        podeAlterar
        podeExcluir
        acoes {
          id
          funcionalidadeId
          chave
          nome
          descricao
          ordem
          ativo
          acaoPadrao
          configuracao
          permitido
        }
      }
    }
  }
`;

export const CREATE_SOLUCAO_MUTATION = gql`
  mutation CreateSolucao($input: CreateSolucaoInput!) {
    createSolucao(input: $input) {
      id
      slug
      nome
      descricao
      eyebrow
      ordem
      ativo
      exibirNoHub
      somenteAdminSistema
      funcionalidades {
        id
        slug
        titulo
        label
        descricao
        ordem
        ativo
        registryKey
        somenteAdminSistema
        padraoSistema
      }
    }
  }
`;

export const UPDATE_SOLUCAO_MUTATION = gql`
  mutation UpdateSolucao($input: UpdateSolucaoInput!) {
    updateSolucao(input: $input) {
      id
      slug
      nome
      descricao
      eyebrow
      ordem
      ativo
      exibirNoHub
      somenteAdminSistema
      funcionalidades {
        id
        slug
        titulo
        label
        descricao
        ordem
        ativo
        registryKey
        somenteAdminSistema
        padraoSistema
      }
    }
  }
`;

export const DELETE_SOLUCAO_MUTATION = gql`
  mutation DeleteSolucao($id: Int!) {
    deleteSolucao(id: $id)
  }
`;

export const CREATE_FUNCIONALIDADE_MUTATION = gql`
  mutation CreateFuncionalidade($input: CreateFuncionalidadeInput!) {
    createFuncionalidade(input: $input) {
      id
      slug
      titulo
      label
      descricao
      ordem
      ativo
      registryKey
      somenteAdminSistema
      padraoSistema
      podeVisualizar
      podeIncluir
      podeAlterar
      podeExcluir
      acoes {
        id
        funcionalidadeId
          chave
          nome
        descricao
        ordem
        ativo
        acaoPadrao
        configuracao
        permitido
      }
    }
  }
`;

export const UPDATE_FUNCIONALIDADE_MUTATION = gql`
  mutation UpdateFuncionalidade($input: UpdateFuncionalidadeInput!) {
    updateFuncionalidade(input: $input) {
      id
      slug
      titulo
      label
      descricao
      ordem
      ativo
      registryKey
      somenteAdminSistema
      padraoSistema
      podeVisualizar
      podeIncluir
      podeAlterar
      podeExcluir
      acoes {
        id
        funcionalidadeId
          chave
          nome
        descricao
        ordem
        ativo
        acaoPadrao
        configuracao
        permitido
      }
    }
  }
`;

export const DELETE_FUNCIONALIDADE_MUTATION = gql`
  mutation DeleteFuncionalidade($id: Int!) {
    deleteFuncionalidade(id: $id)
  }
`;

export const CHAMADO_FIELDS = gql`
  fragment ChamadoFields on ChamadoType {
    id
    numero
    empresaId
    solicitanteId
    solicitanteNome
    responsavelId
    responsavelNome
    responsavelGrupoId
    responsavelGrupoNome
    liderAtendimentoId
    liderAtendimentoNome
    atendimentoAssumidoEm    categoriaId
    categoriaNome
    solucaoId
    solucaoNome
    funcionalidadeId
    funcionalidadeNome
    titulo
    descricao
    tipoId
    tipoNome
    tipoCor
    prioridadeId
    prioridadeNome
    prioridadeCor
    slaRegraId
    status
    criadoEm
    atualizadoEm
    primeiraRespostaEm
    primeiraRespostaLimiteEm
    resolvidoEm
    resolucaoLimiteEm
    slaPausadoEm
    slaTempoPausadoMinutos
    slaStatus
    encerradoEm
    versao
    mensagens {
      id
      chamadoId
      autorId
      autorNome
      tipo
      conteudo
      criadoEm
      anexos {
        id
        chamadoId
        mensagemId
        autorId
        autorNome
        nomeOriginal
        mimeType
        tamanho
        downloadUrl
        criadoEm
      }
    }
    anexos {
      id
      chamadoId
      mensagemId
      autorId
      autorNome
      nomeOriginal
      mimeType
      tamanho
      downloadUrl
      criadoEm
    }
    acompanhantes {
      id
      chamadoId
      usuarioId
      usuarioNome
      usuarioLogin
      usuarioEmail
      adicionadoPorId
      adicionadoPorNome
      ativo
      criadoEm
      atualizadoEm
    }
    historico {
      id
      chamadoId
      usuarioId
      usuarioNome
      evento
      campo
      valorAnterior
      valorNovo
      observacao
      criadoEm
    }
  }
`;

export const CHAMADO_CATEGORIA_FIELDS = gql`
  fragment ChamadoCategoriaFields on ChamadoCategoriaType {
    id
    empresaId
    nome
    descricao
    ativo
    criadoEm
    atualizadoEm
  }
`;

export const CHAMADO_TIPO_FIELDS = gql`
  fragment ChamadoTipoFields on ChamadoTipoType {
    id
    empresaId
    nome
    descricao
    cor
    ordem
    ativo
    criadoEm
    atualizadoEm
  }
`;

export const CHAMADO_PRIORIDADE_FIELDS = gql`
  fragment ChamadoPrioridadeFields on ChamadoPrioridadeType {
    id
    empresaId
    nome
    descricao
    cor
    ordem
    ativo
    criadoEm
    atualizadoEm
  }
`;
export const CHAMADO_SLA_REGRA_FIELDS = gql`
  fragment ChamadoSlaRegraFields on ChamadoSlaRegraType {
    id
    empresaId
    prioridadeId
    prioridadeNome
    primeiraRespostaPrazoMinutos
    resolucaoPrazoMinutos
    modoContagem
    ativo
    criadoEm
    atualizadoEm
  }
`;

export const CHAMADO_RESPONSAVEL_FIELDS = gql`
  fragment ChamadoResponsavelFields on ChamadoResponsavelType {
    id
    empresaId
    tipo
    usuarioId    usuarioNome
    usuarioEmail
    grupoId
    grupoNome
    responsavelNome
    ativo    criadoEm
    atualizadoEm
    solucoes {
      id
      solucaoId
      solucaoNome
      responsavelGeral
      ativo
      funcionalidades {
        id
        funcionalidadeId
        funcionalidadeNome
        ativo
      }
    }
  }
`;
export const MEUS_CHAMADOS_QUERY = gql`
  ${CHAMADO_FIELDS}
  query MeusChamados($filtro: ChamadoFiltroInput) {
    meusChamados(filtro: $filtro) {
      items {
        ...ChamadoFields
      }
      total
      page
      pageSize
    }
  }
`;

export const FILA_CHAMADOS_QUERY = gql`
  ${CHAMADO_FIELDS}
  query FilaChamados($filtro: ChamadoFiltroInput) {
    filaChamados(filtro: $filtro) {
      items {
        ...ChamadoFields
      }
      total
      page
      pageSize
    }
  }
`;

export const CHAMADOS_ARQUIVADOS_QUERY = gql`
  ${CHAMADO_FIELDS}
  query ChamadosArquivados($filtro: ChamadoFiltroInput) {
    chamadosArquivados(filtro: $filtro) {
      items {
        ...ChamadoFields
      }
      total
      page
      pageSize
    }
  }
`;

export const CHAMADO_QUERY = gql`
  ${CHAMADO_FIELDS}
  query Chamado($id: String!) {
    chamado(id: $id) {
      ...ChamadoFields
    }
  }
`;

export const CATEGORIAS_CHAMADO_QUERY = gql`
  ${CHAMADO_CATEGORIA_FIELDS}
  query CategoriasChamado($ativas: Boolean) {
    categoriasChamado(ativas: $ativas) {
      ...ChamadoCategoriaFields
    }
  }
`;
export const TIPOS_CHAMADO_QUERY = gql`
  ${CHAMADO_TIPO_FIELDS}
  query TiposChamado($ativas: Boolean) {
    tiposChamado(ativas: $ativas) {
      ...ChamadoTipoFields
    }
  }
`;

export const PRIORIDADES_CHAMADO_QUERY = gql`
  ${CHAMADO_PRIORIDADE_FIELDS}
  query PrioridadesChamado($ativas: Boolean) {
    prioridadesChamado(ativas: $ativas) {
      ...ChamadoPrioridadeFields
    }
  }
`;
export const ATENDENTES_DISPONIVEIS_QUERY = gql`
  query AtendentesDisponiveis {
    atendentesDisponiveis {
      id
      tipo
      usuarioId
      grupoId
      nome
      login
      email
    }
  }
`;


export const OPCOES_ABERTURA_CHAMADO_QUERY = gql`
  query OpcoesAberturaChamado {
    opcoesAberturaChamado {
      solucoes {
        id
        nome
        slug
        funcionalidades {
          id
          titulo
          label
          slug
        }
      }
    }
  }
`;

export const RESPONSAVEIS_PARA_ABERTURA_CHAMADO_QUERY = gql`
  query ResponsaveisParaAberturaChamado($solucaoId: Int!, $funcionalidadeId: Int) {
    responsaveisParaAberturaChamado(solucaoId: $solucaoId, funcionalidadeId: $funcionalidadeId) {
      id
      tipo
      usuarioId
      grupoId
      nome
      login
      email
    }
  }
`;

export const ACOMPANHANTES_ELEGIVEIS_CHAMADO_QUERY = gql`
  query AcompanhantesElegiveisChamado($chamadoId: String) {
    acompanhantesElegiveisChamado(chamadoId: $chamadoId) {
      id
      nome
      login
      email
      grupoNome
    }
  }
`;
export const CRIAR_CHAMADO_MUTATION = gql`
  ${CHAMADO_FIELDS}
  mutation CriarChamado($input: CriarChamadoInput!) {
    criarChamado(input: $input) {
      ...ChamadoFields
    }
  }
`;

export const RESPONDER_CHAMADO_MUTATION = gql`
  ${CHAMADO_FIELDS}
  mutation ResponderChamado($input: ResponderChamadoInput!) {
    responderChamado(input: $input) {
      ...ChamadoFields
    }
  }
`;

export const ATUALIZAR_ACOMPANHANTES_CHAMADO_MUTATION = gql`
  ${CHAMADO_FIELDS}
  mutation AtualizarAcompanhantesChamado($input: AtualizarChamadoAcompanhantesInput!) {
    atualizarAcompanhantesChamado(input: $input) {
      ...ChamadoFields
    }
  }
`;

export const ASSUMIR_CHAMADO_MUTATION = gql`
  ${CHAMADO_FIELDS}
  mutation AssumirChamado($id: String!) {
    assumirChamado(id: $id) {
      ...ChamadoFields
    }
  }
`;


export const LIBERAR_ATENDIMENTO_CHAMADO_MUTATION = gql`
  ${CHAMADO_FIELDS}
  mutation LiberarAtendimentoChamado($id: String!) {
    liberarAtendimentoChamado(id: $id) {
      ...ChamadoFields
    }
  }
`;
export const ATRIBUIR_CHAMADO_MUTATION = gql`
  ${CHAMADO_FIELDS}
  mutation AtribuirChamado($input: AtribuirChamadoInput!) {
    atribuirChamado(input: $input) {
      ...ChamadoFields
    }
  }
`;

export const TRANSFERIR_CHAMADO_MUTATION = gql`
  ${CHAMADO_FIELDS}
  mutation TransferirChamado($input: AtribuirChamadoInput!) {
    transferirChamado(input: $input) {
      ...ChamadoFields
    }
  }
`;

export const ALTERAR_STATUS_CHAMADO_MUTATION = gql`
  ${CHAMADO_FIELDS}
  mutation AlterarStatusChamado($input: AlterarStatusChamadoInput!) {
    alterarStatusChamado(input: $input) {
      ...ChamadoFields
    }
  }
`;

export const ALTERAR_PRIORIDADE_CHAMADO_MUTATION = gql`
  ${CHAMADO_FIELDS}
  mutation AlterarPrioridadeChamado($input: AlterarPrioridadeChamadoInput!) {
    alterarPrioridadeChamado(input: $input) {
      ...ChamadoFields
    }
  }
`;

export const RESOLVER_CHAMADO_MUTATION = gql`
  ${CHAMADO_FIELDS}
  mutation ResolverChamado($id: String!, $observacao: String) {
    resolverChamado(id: $id, observacao: $observacao) {
      ...ChamadoFields
    }
  }
`;

export const ENCERRAR_CHAMADO_MUTATION = gql`
  ${CHAMADO_FIELDS}
  mutation EncerrarChamado($id: String!, $observacao: String) {
    encerrarChamado(id: $id, observacao: $observacao) {
      ...ChamadoFields
    }
  }
`;

export const ARQUIVAR_CHAMADO_MUTATION = gql`
  ${CHAMADO_FIELDS}
  mutation ArquivarChamado($id: String!, $observacao: String) {
    arquivarChamado(id: $id, observacao: $observacao) {
      ...ChamadoFields
    }
  }
`;

export const REABRIR_CHAMADO_MUTATION = gql`
  ${CHAMADO_FIELDS}
  mutation ReabrirChamado($id: String!, $observacao: String) {
    reabrirChamado(id: $id, observacao: $observacao) {
      ...ChamadoFields
    }
  }
`;


export const RESPONSAVEIS_CHAMADO_QUERY = gql`
  ${CHAMADO_RESPONSAVEL_FIELDS}
  query ResponsaveisChamado($ativas: Boolean) {
    responsaveisChamado(ativas: $ativas) {
      ...ChamadoResponsavelFields
    }
  }
`;

export const RESPONSAVEIS_FILTRO_CHAMADO_QUERY = gql`
  ${CHAMADO_RESPONSAVEL_FIELDS}
  query ResponsaveisFiltroChamado {
    responsaveisFiltroChamado {
      ...ChamadoResponsavelFields
    }
  }
`;
export const RESPONSAVEIS_CHAMADO_OPTIONS_QUERY = gql`
  query ResponsaveisChamadoOptions {
    responsaveisChamadoOptions {
      usuarios {
        id
        nome
        login
        email
        grupoNome
      }
      grupos {
        id
        nome
        descricao
        usuariosCount
      }
      solucoes {        id
        nome
        slug
        funcionalidades {
          id
          titulo
          label
          slug
        }
      }
    }
  }
`;

export const CREATE_CHAMADO_RESPONSAVEL_MUTATION = gql`
  ${CHAMADO_RESPONSAVEL_FIELDS}
  mutation CreateChamadoResponsavel($input: CreateChamadoResponsavelInput!) {
    createChamadoResponsavel(input: $input) {
      ...ChamadoResponsavelFields
    }
  }
`;

export const UPDATE_CHAMADO_RESPONSAVEL_MUTATION = gql`
  ${CHAMADO_RESPONSAVEL_FIELDS}
  mutation UpdateChamadoResponsavel($input: UpdateChamadoResponsavelInput!) {
    updateChamadoResponsavel(input: $input) {
      ...ChamadoResponsavelFields
    }
  }
`;

export const DELETE_CHAMADO_RESPONSAVEL_MUTATION = gql`
  mutation DeleteChamadoResponsavel($id: Int!) {
    deleteChamadoResponsavel(id: $id)
  }
`;
export const CREATE_CHAMADO_TIPO_MUTATION = gql`
  ${CHAMADO_TIPO_FIELDS}
  mutation CreateChamadoTipo($input: CreateChamadoTipoInput!) {
    createChamadoTipo(input: $input) {
      ...ChamadoTipoFields
    }
  }
`;

export const UPDATE_CHAMADO_TIPO_MUTATION = gql`
  ${CHAMADO_TIPO_FIELDS}
  mutation UpdateChamadoTipo($input: UpdateChamadoTipoInput!) {
    updateChamadoTipo(input: $input) {
      ...ChamadoTipoFields
    }
  }
`;

export const DELETE_CHAMADO_TIPO_MUTATION = gql`
  mutation DeleteChamadoTipo($id: Int!) {
    deleteChamadoTipo(id: $id)
  }
`;

export const CREATE_CHAMADO_PRIORIDADE_MUTATION = gql`
  ${CHAMADO_PRIORIDADE_FIELDS}
  mutation CreateChamadoPrioridade($input: CreateChamadoPrioridadeInput!) {
    createChamadoPrioridade(input: $input) {
      ...ChamadoPrioridadeFields
    }
  }
`;

export const UPDATE_CHAMADO_PRIORIDADE_MUTATION = gql`
  ${CHAMADO_PRIORIDADE_FIELDS}
  mutation UpdateChamadoPrioridade($input: UpdateChamadoPrioridadeInput!) {
    updateChamadoPrioridade(input: $input) {
      ...ChamadoPrioridadeFields
    }
  }
`;

export const DELETE_CHAMADO_PRIORIDADE_MUTATION = gql`
  mutation DeleteChamadoPrioridade($id: Int!) {
    deleteChamadoPrioridade(id: $id)
  }
`;
export const CREATE_CHAMADO_CATEGORIA_MUTATION = gql`
  ${CHAMADO_CATEGORIA_FIELDS}
  mutation CreateChamadoCategoria($input: CreateChamadoCategoriaInput!) {
    createChamadoCategoria(input: $input) {
      ...ChamadoCategoriaFields
    }
  }
`;

export const UPDATE_CHAMADO_CATEGORIA_MUTATION = gql`
  ${CHAMADO_CATEGORIA_FIELDS}
  mutation UpdateChamadoCategoria($input: UpdateChamadoCategoriaInput!) {
    updateChamadoCategoria(input: $input) {
      ...ChamadoCategoriaFields
    }
  }
`;

export const DELETE_CHAMADO_CATEGORIA_MUTATION = gql`
  mutation DeleteChamadoCategoria($id: Int!) {
    deleteChamadoCategoria(id: $id)
  }
`;

export const REGRAS_SLA_CHAMADO_QUERY = gql`
  ${CHAMADO_SLA_REGRA_FIELDS}
  query RegrasSlaChamado($ativas: Boolean) {
    regrasSlaChamado(ativas: $ativas) {
      ...ChamadoSlaRegraFields
    }
  }
`;

export const CREATE_CHAMADO_SLA_REGRA_MUTATION = gql`
  ${CHAMADO_SLA_REGRA_FIELDS}
  mutation CreateChamadoSlaRegra($input: CreateChamadoSlaRegraInput!) {
    createChamadoSlaRegra(input: $input) {
      ...ChamadoSlaRegraFields
    }
  }
`;

export const UPDATE_CHAMADO_SLA_REGRA_MUTATION = gql`
  ${CHAMADO_SLA_REGRA_FIELDS}
  mutation UpdateChamadoSlaRegra($input: UpdateChamadoSlaRegraInput!) {
    updateChamadoSlaRegra(input: $input) {
      ...ChamadoSlaRegraFields
    }
  }
`;

export const DELETE_CHAMADO_SLA_REGRA_MUTATION = gql`
  mutation DeleteChamadoSlaRegra($id: Int!) {
    deleteChamadoSlaRegra(id: $id)
  }
`;

export const CHAMADO_NOTIFICACOES_QUERY = gql("query ChamadoNotificacoes($limite: Int) { notificacoesChamado(limite: $limite) { id chamadoId chamadoNumero chamadoTitulo tipo titulo mensagem lidaEm criadoEm } notificacoesChamadoNaoLidas }");
export const MARCAR_CHAMADO_NOTIFICACAO_LIDA_MUTATION = gql("mutation MarcarChamadoNotificacaoComoLida($id: String!) { marcarChamadoNotificacaoComoLida(id: $id) }");
export const MARCAR_TODAS_CHAMADO_NOTIFICACOES_LIDAS_MUTATION = gql("mutation MarcarTodasChamadoNotificacoesComoLidas { marcarTodasChamadoNotificacoesComoLidas }");
export const GOOGLE_EMAIL_CONTAS_QUERY = gql("query GoogleEmailContasChamado { googleEmailContasChamado { id nome tipo emailGoogle conectado conectadoEm ativo principal } }");
export const GOOGLE_EMAIL_AUTH_URL_QUERY = gql("query GoogleEmailAuthUrl($id: Int!) { googleEmailAuthUrl(id: $id) }");
export const CREATE_GOOGLE_EMAIL_CONTA_MUTATION = gql("mutation CreateGoogleEmailConta($input: CreateGoogleEmailContaInput!) { createGoogleEmailConta(input: $input) { id nome tipo emailGoogle conectado conectadoEm ativo principal } }");
export const UPDATE_GOOGLE_EMAIL_CONTA_MUTATION = gql("mutation UpdateGoogleEmailConta($input: UpdateGoogleEmailContaInput!) { updateGoogleEmailConta(input: $input) { id nome tipo emailGoogle conectado conectadoEm ativo principal } }");
export const DELETE_GOOGLE_EMAIL_CONTA_MUTATION = gql("mutation DeleteGoogleEmailConta($id: Int!) { deleteGoogleEmailConta(id: $id) }");
export const CHAMADO_DASHBOARD_QUERY = gql("query ChamadoDashboard { dashboardChamados { totalAbertos emAtendimento pendentes resolvidos arquivados atrasados tempoMedioPrimeiraRespostaMinutos tempoMedioResolucaoMinutos porPrioridade { chave nome total cor } porCategoria { chave nome total cor } porAtendente { chave nome total cor } } }");

export const CHAMADO_RELATORIO_QUERY = gql("query ChamadoRelatorio($filtro: ChamadoRelatorioFiltroInput) { relatorioChamados(filtro: $filtro) { total page pageSize totalPages items { id numero titulo status slaStatus prioridade categoria solicitante atendente criadoEm primeiraRespostaEm resolvidoEm tempoPrimeiraRespostaMinutos tempoResolucaoMinutos } } }");

export const ALTERAR_CATEGORIA_CHAMADO_MUTATION = gql`
  ${CHAMADO_FIELDS}
  mutation AlterarCategoriaChamado($input: AlterarCategoriaChamadoInput!) { alterarCategoriaChamado(input: $input) { ...ChamadoFields } }
`;

const PROJETO_FIELDS = gql`
  fragment ProjetoFields on ProjetoType {
    id empresaId chave nome objetivo descricao metodologia situacao saude
    inicioPrevistoEm fimPrevistoEm inicioRealEm fimRealEm responsavelId
    responsavel { id nome login email grupoId grupoNome }
    criadoPor { id nome login email grupoId grupoNome }
    arquivadoEm
    arquivadoPor { id nome login email grupoId grupoNome }
    criadoEm atualizadoEm
    membros { id usuarioId papel incluidoEm usuario { id nome login email grupoId grupoNome } }
    meuPapel
    permissoes { podeVisualizar podeAlterar podeGerenciarMembros podeAlterarStatus podeArquivar podeReativar }
  }
`;

export const PROJETOS_QUERY = gql`
  ${PROJETO_FIELDS}
  query Projetos($filtro: ProjetoFiltroInput) {
    projetos(filtro: $filtro) { items { ...ProjetoFields } total pagina limite totalPaginas }
  }
`;
export const PROJETO_QUERY = gql`
  ${PROJETO_FIELDS}
  query Projeto($id: String!) { projeto(id: $id) { ...ProjetoFields } }
`;
export const SUGERIR_CHAVE_PROJETO_QUERY = gql`
  query SugerirChaveProjeto($nome: String!) { sugerirChaveProjeto(nome: $nome) }
`;
export const PROJETO_PARTICIPANTES_DISPONIVEIS_QUERY = gql`
  query ProjetoParticipantesDisponiveis {
    projetoParticipantesDisponiveis { id nome login email grupoId grupoNome }
  }
`;

export const CREATE_PROJETO_MUTATION = gql`
  ${PROJETO_FIELDS}
  mutation CreateProjeto($input: CreateProjetoInput!) { createProjeto(input: $input) { ...ProjetoFields } }
`;
export const UPDATE_PROJETO_MUTATION = gql`
  ${PROJETO_FIELDS}
  mutation UpdateProjeto($input: UpdateProjetoInput!) { updateProjeto(input: $input) { ...ProjetoFields } }
`;
export const UPDATE_PROJETO_EQUIPE_MUTATION = gql`
  ${PROJETO_FIELDS}
  mutation UpdateProjetoEquipe($input: UpdateProjetoEquipeInput!) { updateProjetoEquipe(input: $input) { ...ProjetoFields } }
`;
export const ATUALIZAR_CICLO_PROJETO_MUTATION = gql`
  ${PROJETO_FIELDS}
  mutation AtualizarSituacaoProjeto($input: AtualizarCicloProjetoInput!) { atualizarSituacaoProjeto(input: $input) { ...ProjetoFields } }
`;
export const ARQUIVAR_PROJETO_MUTATION = gql`
  ${PROJETO_FIELDS}
  mutation ArquivarProjeto($id: String!) { arquivarProjeto(id: $id) { ...ProjetoFields } }
`;
export const REATIVAR_PROJETO_MUTATION = gql`
  ${PROJETO_FIELDS}
  mutation ReativarProjeto($id: String!) { reativarProjeto(id: $id) { ...ProjetoFields } }
`;

const PROJETO_ITEM_FIELDS = gql`
  fragment ProjetoItemFields on ProjetoItemType {
    id empresaId projetoId numero chave ordemBacklog tipo titulo descricao
    status prioridade responsavelId
    responsavel { id nome login email grupoId grupoNome }
    autorId
    autor { id nome login email grupoId grupoNome }
    paiId inicioPrevistoEm fimPrevistoEm estimativaMinutos concluidoEm versao
    arquivadoEm
    arquivadoPor { id nome login email grupoId grupoNome }
    criadoEm atualizadoEm
    permissoes {
      podeVisualizar podeCriar podeAlterar podeAlterarStatus
      podeArquivar podeReativar podePriorizar
    }
  }
`;

export const PROJETO_BACKLOG_PROJETOS_QUERY = gql`
  query ProjetoBacklogProjetos($incluirArquivados: Boolean) {
    projetoBacklogProjetos(incluirArquivados: $incluirArquivados) {
      id chave nome arquivadoEm
    }
  }
`;
export const PROJETO_BACKLOG_RESPONSAVEIS_QUERY = gql`
  query ProjetoBacklogResponsaveis($projetoId: String!) {
    projetoBacklogResponsaveis(projetoId: $projetoId) {
      id nome login email grupoId grupoNome
    }
  }
`;
export const PROJETO_ITENS_QUERY = gql`
  ${PROJETO_ITEM_FIELDS}
  query ProjetoItens($filtro: ProjetoItemFiltroInput!) {
    projetoItens(filtro: $filtro) {
      items { ...ProjetoItemFields }
      total pagina limite totalPaginas backlogVersao
      permissoes {
        podeVisualizar podeCriar podeAlterar podeAlterarStatus
        podeArquivar podeReativar podePriorizar
      }
    }
  }
`;
export const PROJETO_ITEM_QUERY = gql`
  ${PROJETO_ITEM_FIELDS}
  query ProjetoItem($id: String!) {
    projetoItem(id: $id) { ...ProjetoItemFields }
  }
`;
export const PROJETO_ITEM_HISTORICO_QUERY = gql`
  query ProjetoItemHistorico($id: String!) {
    projetoItemHistorico(id: $id) {
      id evento dados criadoEm
      usuario { id nome login email grupoId grupoNome }
    }
  }
`;
export const CREATE_PROJETO_ITEM_MUTATION = gql`
  ${PROJETO_ITEM_FIELDS}
  mutation CreateProjetoItem($input: CreateProjetoItemInput!) {
    createProjetoItem(input: $input) { ...ProjetoItemFields }
  }
`;
export const UPDATE_PROJETO_ITEM_MUTATION = gql`
  ${PROJETO_ITEM_FIELDS}
  mutation UpdateProjetoItem($input: UpdateProjetoItemInput!) {
    updateProjetoItem(input: $input) { ...ProjetoItemFields }
  }
`;
export const ALTERAR_STATUS_PROJETO_ITEM_MUTATION = gql`
  ${PROJETO_ITEM_FIELDS}
  mutation AlterarStatusProjetoItem($input: AlterarStatusProjetoItemInput!) {
    alterarStatusProjetoItem(input: $input) { ...ProjetoItemFields }
  }
`;
export const ARQUIVAR_PROJETO_ITEM_MUTATION = gql`
  ${PROJETO_ITEM_FIELDS}
  mutation ArquivarProjetoItem($input: VersionarProjetoItemInput!) {
    arquivarProjetoItem(input: $input) { ...ProjetoItemFields }
  }
`;
export const REATIVAR_PROJETO_ITEM_MUTATION = gql`
  ${PROJETO_ITEM_FIELDS}
  mutation ReativarProjetoItem($input: VersionarProjetoItemInput!) {
    reativarProjetoItem(input: $input) { ...ProjetoItemFields }
  }
`;
export const MOVER_PROJETO_ITEM_BACKLOG_MUTATION = gql`
  mutation MoverProjetoItemBacklog($input: MoverProjetoItemBacklogInput!) {
    moverProjetoItemBacklog(input: $input) { itemId backlogVersao }
  }
`;

const PROJETO_COMUNICACAO_USER_FIELDS = gql`
  fragment ProjetoComunicacaoUserFields on ProjetoUsuarioType { id nome login email grupoId grupoNome }
`;
const PROJETO_ANEXO_FIELDS = gql`
  ${PROJETO_COMUNICACAO_USER_FIELDS}
  fragment ProjetoAnexoFields on ProjetoAnexoType {
    id projetoId nomeOriginal mimeType tamanho downloadUrl criadoEm
    autor { ...ProjetoComunicacaoUserFields }
  }
`;
const PROJETO_ATUALIZACAO_FIELDS = gql`
  ${PROJETO_COMUNICACAO_USER_FIELDS}
  ${PROJETO_ANEXO_FIELDS}
  fragment ProjetoAtualizacaoFields on ProjetoAtualizacaoType {
    id projetoId conteudo saudePercebida versao podeEditar criadoEm atualizadoEm
    autor { ...ProjetoComunicacaoUserFields }
    anexos { ...ProjetoAnexoFields }
    historico {
      id conteudoAnterior saudePercebidaAnterior versaoAnterior criadoEm
      editor { ...ProjetoComunicacaoUserFields }
    }
  }
`;
const PROJETO_COMENTARIO_FIELDS = gql`
  ${PROJETO_COMUNICACAO_USER_FIELDS}
  ${PROJETO_ANEXO_FIELDS}
  fragment ProjetoComentarioFields on ProjetoComentarioType {
    id projetoId conteudo atualizacaoId itemId itemChave contexto versao
    podeEditar podeExcluir editadoEm criadoEm
    autor { ...ProjetoComunicacaoUserFields }
    anexos { ...ProjetoAnexoFields }
  }
`;
export const PROJETO_COMUNICACAO_PROJETOS_QUERY = gql`
  query ProjetoComunicacaoProjetos { projetoComunicacaoProjetos { id chave nome arquivadoEm } }
`;
export const PROJETO_COMUNICACAO_QUERY = gql`
  ${PROJETO_COMUNICACAO_USER_FIELDS}
  ${PROJETO_ANEXO_FIELDS}
  ${PROJETO_ATUALIZACAO_FIELDS}
  ${PROJETO_COMENTARIO_FIELDS}
  query ProjetoComunicacao($projetoId: String!, $feed: ProjetoComunicacaoFeedFiltroInput) {
    projetoComunicacao(projetoId: $projetoId, feed: $feed) {
      atualizacoes { ...ProjetoAtualizacaoFields }
      comentarios { ...ProjetoComentarioFields }
      itensDisponiveis { id chave titulo }
      feed {
        id tipo entidadeId registro evento entidade funcionalidade conteudo saudePercebida contexto editado criadoEm
        autor { ...ProjetoComunicacaoUserFields }
        autorAcao { ...ProjetoComunicacaoUserFields }
        alteracoes { campo valorAnterior valorNovo }
        anexos { ...ProjetoAnexoFields }
      }
      feedTotal feedPagina feedLimite feedTotalPaginas
      permissoes { podePublicarAtualizacao podeEditarAtualizacao podeComentar podeModerar podeGerenciarAnexos }
      ultimaAtualizacaoEm
    }
  }
`;
export const CREATE_PROJETO_ATUALIZACAO_MUTATION = gql`
  ${PROJETO_ATUALIZACAO_FIELDS}
  mutation CreateProjetoAtualizacao($input: CreateProjetoAtualizacaoInput!) { createProjetoAtualizacao(input: $input) { ...ProjetoAtualizacaoFields } }
`;
export const UPDATE_PROJETO_ATUALIZACAO_MUTATION = gql`
  ${PROJETO_ATUALIZACAO_FIELDS}
  mutation UpdateProjetoAtualizacao($input: UpdateProjetoAtualizacaoInput!) { updateProjetoAtualizacao(input: $input) { ...ProjetoAtualizacaoFields } }
`;
export const CREATE_PROJETO_COMENTARIO_MUTATION = gql`
  ${PROJETO_COMENTARIO_FIELDS}
  mutation CreateProjetoComentario($input: CreateProjetoComentarioInput!) { createProjetoComentario(input: $input) { ...ProjetoComentarioFields } }
`;
export const UPDATE_PROJETO_COMENTARIO_MUTATION = gql`
  ${PROJETO_COMENTARIO_FIELDS}
  mutation UpdateProjetoComentario($input: UpdateProjetoComentarioInput!) { updateProjetoComentario(input: $input) { ...ProjetoComentarioFields } }
`;
export const EXCLUIR_PROJETO_COMENTARIO_MUTATION = gql`
  ${PROJETO_COMENTARIO_FIELDS}
  mutation ExcluirProjetoComentario($input: ExcluirProjetoComentarioInput!) { excluirProjetoComentario(input: $input) { ...ProjetoComentarioFields } }
`;
const PROJETO_RECURSO_USER_FIELDS = gql`
  fragment ProjetoRecursoUserFields on ProjetoUsuarioType { id nome login email }
`;
export const PROJETO_RECURSOS_PROJETOS_QUERY = gql`
  query ProjetoRecursosProjetos { projetoRecursosProjetos { id chave nome arquivadoEm } }
`;
export const PROJETO_RECURSOS_QUERY = gql`
  ${PROJETO_RECURSO_USER_FIELDS}
  query ProjetoRecursos {
    projetoRecursos {
      candidatos { ...ProjetoRecursoUserFields }
      recursos {
        id usuarioId ativo versao
        usuario { ...ProjetoRecursoUserFields }
        projetos {
          id projetoId ativo versao
          projeto { id chave nome arquivadoEm }
        }
      }
      permissoes { podeIncluir podeAlterar podeExcluir }
    }
  }
`;
export const SALVAR_PROJETO_RECURSO_MUTATION = gql`mutation SalvarProjetoRecurso($input: SalvarProjetoRecursoInput!) { salvarProjetoRecurso(input: $input) { id } }`;
export const EXCLUIR_PROJETO_RECURSO_MUTATION = gql`mutation ExcluirProjetoRecurso($input: ExcluirProjetoRecursoInput!) { excluirProjetoRecurso(input: $input) }`;
export const SALVAR_PROJETO_TAREFA_MUTATION = gql`mutation SalvarProjetoTarefa($input: SalvarProjetoTarefaInput!) { salvarProjetoTarefa(input: $input) { id } }`;
export const EXCLUIR_PROJETO_TAREFA_MUTATION = gql`mutation ExcluirProjetoTarefa($input: ExcluirProjetoTarefaInput!) { excluirProjetoTarefa(input: $input) }`;
export const PLANEJAMENTO_RECURSOS_QUERY = gql`
  ${PROJETO_RECURSO_USER_FIELDS}
  query PlanejamentoRecursos {
    planejamentoRecursos {
      recursos { id usuarioId ativo versao usuario { ...ProjetoRecursoUserFields } }
      projetos { id chave nome arquivadoEm }
      tarefas {
        id recursoIds funcionalidade estimativaMinutos valorHora moeda observacao ativo versao
        pendenteRecurso planejadoMinutos saldoMinutos sobreplanejada
        recursos {
          id recursoId ativo
          recurso { id ativo usuario { ...ProjetoRecursoUserFields } }
        }
        taxas { id valorHora moeda criadoEm criadoPor { ...ProjetoRecursoUserFields } }
      }
      linhas {
        id cadastroRecursoId projetoId versao recursoAtivo vinculoAtivo
        usuario { ...ProjetoRecursoUserFields }
        projeto { id chave nome arquivadoEm }
        alocacaoTotalMinutos estimativaTotalMinutos planejamentoTarefasMinutos saldoTarefasMinutos alocacoesPendentes possuiRisco
        custosEstimados { moeda valor }
        tarefas {
          id recursoIds funcionalidade estimativaMinutos valorHora moeda observacao ativo versao
          pendenteRecurso planejadoMinutos saldoMinutos sobreplanejada
          recursos {
            id recursoId ativo
            recurso { id ativo usuario { ...ProjetoRecursoUserFields } }
          }
          taxas { id valorHora moeda criadoEm criadoPor { ...ProjetoRecursoUserFields } }
        }
        alocacoes { id projetoRecursoId tarefaId atividade inicioEm fimEm alocacaoMinutos versao }
      }
      tarefasPendentes {
        id recursoIds funcionalidade estimativaMinutos valorHora moeda observacao ativo versao
        pendenteRecurso planejadoMinutos saldoMinutos sobreplanejada
        recursos {
          id recursoId ativo
          recurso { id ativo usuario { ...ProjetoRecursoUserFields } }
        }
        taxas { id valorHora moeda criadoEm criadoPor { ...ProjetoRecursoUserFields } }
      }
      permissoes { podeIncluir podeAlterar podeExcluir }
    }
  }
`;
export const SALVAR_PLANEJAMENTO_RECURSO_EXECUCAO_MUTATION = gql`mutation SalvarPlanejamentoRecursoExecucao($input: SalvarPlanejamentoRecursoExecucaoInput!) { salvarPlanejamentoRecursoExecucao(input: $input) { id } }`;
export const EXCLUIR_PLANEJAMENTO_RECURSO_EXECUCAO_MUTATION = gql`mutation ExcluirPlanejamentoRecursoExecucao($input: ExcluirPlanejamentoRecursoExecucaoInput!) { excluirPlanejamentoRecursoExecucao(input: $input) }`;export const PROJETO_ORCAMENTO_PROJETOS_QUERY = gql`
  query ProjetoOrcamentoProjetos { projetoOrcamentoProjetos { id chave nome arquivadoEm } }
`;
export const PROJETO_ORCAMENTO_QUERY = gql`
  ${PROJETO_RECURSO_USER_FIELDS}
  query ProjetoOrcamento($projetoId: String!) {
    projetoOrcamento(projetoId: $projetoId) {
      recursos { id cadastroRecursoId usuarioId ativo versao usuario { ...ProjetoRecursoUserFields } }
      tarefas { id recursoIds funcionalidade estimativaMinutos valorHora moeda ativo }
      financeiro {
        id moeda status versao totalPlanejado totalComprometido totalRealizado variacao aprovadoEm
        categorias { id nome valorPlanejado valorComprometido valorRealizado variacao versao }
        custos { id categoriaId tipo descricao recursoId tarefaId quantidadeMinutos taxaHora valorPlanejado valorComprometido valorRealizado versao recurso { id cadastroRecursoId usuarioId ativo versao usuario { ...ProjetoRecursoUserFields } } tarefa { id recursoIds funcionalidade estimativaMinutos valorHora moeda ativo } taxas { id taxaHora criadoEm criadoPor { ...ProjetoRecursoUserFields } } }
      }
      permissoes { podeVisualizarFinanceiro podeGerenciarFinanceiro podeAprovarOrcamento }
    }
  }
`;
export const SALVAR_PROJETO_ORCAMENTO_MUTATION = gql`mutation SalvarProjetoOrcamento($input: SalvarProjetoOrcamentoInput!) { salvarProjetoOrcamento(input: $input) { id } }`;
export const SALVAR_PROJETO_ORCAMENTO_CATEGORIA_MUTATION = gql`mutation SalvarProjetoOrcamentoCategoria($input: SalvarProjetoOrcamentoCategoriaInput!) { salvarProjetoOrcamentoCategoria(input: $input) { id } }`;
export const SALVAR_PROJETO_CUSTO_MUTATION = gql`mutation SalvarProjetoCusto($input: SalvarProjetoCustoInput!) { salvarProjetoCusto(input: $input) { id } }`;
export const EXCLUIR_PROJETO_ORCAMENTO_CATEGORIA_MUTATION = gql`mutation ExcluirProjetoOrcamentoCategoria($input: ExcluirProjetoOrcamentoItemInput!) { excluirProjetoOrcamentoCategoria(input: $input) }`;
export const EXCLUIR_PROJETO_CUSTO_MUTATION = gql`mutation ExcluirProjetoCusto($input: ExcluirProjetoOrcamentoItemInput!) { excluirProjetoCusto(input: $input) }`;
export const APROVAR_PROJETO_ORCAMENTO_MUTATION = gql`mutation AprovarProjetoOrcamento($input: AprovarProjetoOrcamentoInput!) { aprovarProjetoOrcamento(input: $input) { id status versao } }`;
export const REABRIR_PROJETO_ORCAMENTO_MUTATION = gql`mutation ReabrirProjetoOrcamento($input: AprovarProjetoOrcamentoInput!) { reabrirProjetoOrcamento(input: $input) { id status versao } }`;

const PROJETO_SPRINT_ITEM_FIELDS = gql`
  fragment ProjetoSprintItemFields on ProjetoSprintItemType {
    vinculoId itemId chave titulo tipo status prioridade estimativaMinutos
    escopoInicial adicionadoAposInicio retiradoAposInicio incluidoEm retiradoEm
    statusAoIniciar estimativaAoIniciar statusAoEncerrar estimativaAoEncerrar concluidoNoSprint
  }
`;
const PROJETO_SPRINT_FIELDS = gql`
  fragment ProjetoSprintFields on ProjetoSprintType {
    id projetoId nome objetivo status inicioPrevistoEm fimPrevistoEm inicioRealEm fimRealEm
    resultado versao escopoInicialItens escopoInicialEstimativa itensConcluidos estimativaConcluida
    itensAdicionadosAposInicio itensRetiradosAposInicio totalItens totalConcluidos progressoPercentual
    itens { ...ProjetoSprintItemFields } criadoEm atualizadoEm
  }
  ${PROJETO_SPRINT_ITEM_FIELDS}
`;
export const PROJETO_SPRINTS_QUERY = gql`
  query ProjetoSprints($projetoId: String!) {
    projetoSprints(projetoId: $projetoId) {
      planejadas { ...ProjetoSprintFields } ativa { ...ProjetoSprintFields } historico { ...ProjetoSprintFields }
      candidatos { id chave titulo tipo status prioridade estimativaMinutos }
      permissoes { podeVisualizar podeCriar podeEditar podePlanejar podeIniciar podeConcluir podeCancelar }
    }
  }
  ${PROJETO_SPRINT_FIELDS}
`;
export const CREATE_PROJETO_SPRINT_MUTATION = gql`mutation CreateProjetoSprint($input: CreateProjetoSprintInput!) { createProjetoSprint(input: $input) { ...ProjetoSprintFields } } ${PROJETO_SPRINT_FIELDS}`;
export const UPDATE_PROJETO_SPRINT_MUTATION = gql`mutation UpdateProjetoSprint($input: UpdateProjetoSprintInput!) { updateProjetoSprint(input: $input) { ...ProjetoSprintFields } } ${PROJETO_SPRINT_FIELDS}`;
export const ADICIONAR_ITEM_PROJETO_SPRINT_MUTATION = gql`mutation AdicionarItemProjetoSprint($input: AlterarEscopoProjetoSprintInput!) { adicionarItemProjetoSprint(input: $input) { ...ProjetoSprintFields } } ${PROJETO_SPRINT_FIELDS}`;
export const REMOVER_ITEM_PROJETO_SPRINT_MUTATION = gql`mutation RemoverItemProjetoSprint($input: AlterarEscopoProjetoSprintInput!) { removerItemProjetoSprint(input: $input) { ...ProjetoSprintFields } } ${PROJETO_SPRINT_FIELDS}`;
export const INICIAR_PROJETO_SPRINT_MUTATION = gql`mutation IniciarProjetoSprint($input: TransicionarProjetoSprintInput!) { iniciarProjetoSprint(input: $input) { ...ProjetoSprintFields } } ${PROJETO_SPRINT_FIELDS}`;
export const CONCLUIR_PROJETO_SPRINT_MUTATION = gql`mutation ConcluirProjetoSprint($input: ConcluirProjetoSprintInput!) { concluirProjetoSprint(input: $input) { ...ProjetoSprintFields } } ${PROJETO_SPRINT_FIELDS}`;
export const CANCELAR_PROJETO_SPRINT_MUTATION = gql`mutation CancelarProjetoSprint($input: TransicionarProjetoSprintInput!) { cancelarProjetoSprint(input: $input) { ...ProjetoSprintFields } } ${PROJETO_SPRINT_FIELDS}`;

const PROJETO_COMPROMISSO_ITEM_FIELDS = gql`fragment ProjetoCompromissoItemFields on ProjetoCompromissoItemType { id chave titulo status estimativaMinutos }`;
const PROJETO_MARCO_FIELDS = gql`
  fragment ProjetoMarcoFields on ProjetoMarcoType {
    id projetoId nome descricao status dataPrevistaEm dataRealizadaEm versao atrasado progressoPercentual
    itensSemEstimativa arquivadoEm criadoEm atualizadoEm responsavel { id nome login email }
    itens { ...ProjetoCompromissoItemFields }
  }
  ${PROJETO_COMPROMISSO_ITEM_FIELDS}
`;
const PROJETO_ENTREGA_FIELDS = gql`
  fragment ProjetoEntregaFields on ProjetoEntregaType {
    id projetoId nome resultadoEsperado criteriosAceite status inicioPrevistoEm fimPrevistoEm concluidaEm
    marcoId marcoNome versao atrasada progressoPercentual itensSemEstimativa arquivadoEm criadoEm atualizadoEm
    responsavel { id nome login email } itens { ...ProjetoCompromissoItemFields }
  }
  ${PROJETO_COMPROMISSO_ITEM_FIELDS}
`;
export const PROJETO_MARCOS_ENTREGAS_QUERY = gql`
  query ProjetoMarcosEntregas($projetoId: String!, $incluirArquivados: Boolean) {
    projetoMarcosEntregas(projetoId: $projetoId, incluirArquivados: $incluirArquivados) {
      marcos { ...ProjetoMarcoFields } entregas { ...ProjetoEntregaFields }
      itensDisponiveis { ...ProjetoCompromissoItemFields } responsaveis { id nome login email }
      permissoes { podeVisualizar podeCriar podeEditar podeArquivar podeReativar }
    }
  }
  ${PROJETO_MARCO_FIELDS}
  ${PROJETO_ENTREGA_FIELDS}
`;
export const CREATE_PROJETO_MARCO_MUTATION = gql`mutation CreateProjetoMarco($input: CreateProjetoMarcoInput!) { createProjetoMarco(input: $input) { ...ProjetoMarcoFields } } ${PROJETO_MARCO_FIELDS}`;
export const UPDATE_PROJETO_MARCO_MUTATION = gql`mutation UpdateProjetoMarco($input: UpdateProjetoMarcoInput!) { updateProjetoMarco(input: $input) { ...ProjetoMarcoFields } } ${PROJETO_MARCO_FIELDS}`;
export const CREATE_PROJETO_ENTREGA_MUTATION = gql`mutation CreateProjetoEntrega($input: CreateProjetoEntregaInput!) { createProjetoEntrega(input: $input) { ...ProjetoEntregaFields } } ${PROJETO_ENTREGA_FIELDS}`;
export const UPDATE_PROJETO_ENTREGA_MUTATION = gql`mutation UpdateProjetoEntrega($input: UpdateProjetoEntregaInput!) { updateProjetoEntrega(input: $input) { ...ProjetoEntregaFields } } ${PROJETO_ENTREGA_FIELDS}`;
export const ARQUIVAR_PROJETO_MARCO_MUTATION = gql`mutation ArquivarProjetoMarco($input: VersionarProjetoCompromissoInput!) { arquivarProjetoMarco(input: $input) { id } }`;
export const REATIVAR_PROJETO_MARCO_MUTATION = gql`mutation ReativarProjetoMarco($input: VersionarProjetoCompromissoInput!) { reativarProjetoMarco(input: $input) { id } }`;
export const ARQUIVAR_PROJETO_ENTREGA_MUTATION = gql`mutation ArquivarProjetoEntrega($input: VersionarProjetoCompromissoInput!) { arquivarProjetoEntrega(input: $input) { id } }`;
export const REATIVAR_PROJETO_ENTREGA_MUTATION = gql`mutation ReativarProjetoEntrega($input: VersionarProjetoCompromissoInput!) { reativarProjetoEntrega(input: $input) { id } }`;

const PROJETO_CRONOGRAMA_ITEM_REFERENCIA_FIELDS = gql`fragment ProjetoCronogramaItemReferenciaFields on ProjetoCronogramaItemReferenciaType { id chave titulo status inicioPrevistoEm fimPrevistoEm arquivadoEm }`;
const PROJETO_ITEM_DEPENDENCIA_FIELDS = gql`
  fragment ProjetoItemDependenciaFields on ProjetoItemDependenciaType {
    id projetoId versao arquivadoEm criadoEm atualizadoEm
    bloqueador { ...ProjetoCronogramaItemReferenciaFields } bloqueado { ...ProjetoCronogramaItemReferenciaFields }
  }
  ${PROJETO_CRONOGRAMA_ITEM_REFERENCIA_FIELDS}
`;
const PROJETO_CRONOGRAMA_ELEMENTO_FIELDS = gql`fragment ProjetoCronogramaElementoFields on ProjetoCronogramaElementoType { id tipo titulo chave status grupo inicioEm fimEm versao progressoPercentual semPeriodo bloqueado riscoAtraso arquivado itemIds }`;
export const PROJETO_CRONOGRAMA_QUERY = gql`
  query ProjetoCronograma($filtro: ProjetoCronogramaFiltroInput!) {
    projetoCronograma(filtro: $filtro) {
      inicioEm fimEm permissoes { podeVisualizar podeGerenciarDependencias podeEditarDatas }
      elementos { ...ProjetoCronogramaElementoFields } dependencias { ...ProjetoItemDependenciaFields }
      inconsistencias { codigo severidade mensagem elementoIds }
    }
  }
  ${PROJETO_CRONOGRAMA_ELEMENTO_FIELDS}
  ${PROJETO_ITEM_DEPENDENCIA_FIELDS}
`;
export const CREATE_PROJETO_ITEM_DEPENDENCIA_MUTATION = gql`mutation CreateProjetoItemDependencia($input: CreateProjetoItemDependenciaInput!) { createProjetoItemDependencia(input: $input) { ...ProjetoItemDependenciaFields } } ${PROJETO_ITEM_DEPENDENCIA_FIELDS}`;
export const ARQUIVAR_PROJETO_ITEM_DEPENDENCIA_MUTATION = gql`mutation ArquivarProjetoItemDependencia($input: VersionarProjetoItemDependenciaInput!) { arquivarProjetoItemDependencia(input: $input) { ...ProjetoItemDependenciaFields } } ${PROJETO_ITEM_DEPENDENCIA_FIELDS}`;
export const REATIVAR_PROJETO_ITEM_DEPENDENCIA_MUTATION = gql`mutation ReativarProjetoItemDependencia($input: VersionarProjetoItemDependenciaInput!) { reativarProjetoItemDependencia(input: $input) { ...ProjetoItemDependenciaFields } } ${PROJETO_ITEM_DEPENDENCIA_FIELDS}`;
export const UPDATE_PROJETO_CRONOGRAMA_ITEM_DATAS_MUTATION = gql`mutation UpdateProjetoCronogramaItemDatas($input: UpdateProjetoCronogramaItemDatasInput!) { updateProjetoCronogramaItemDatas(input: $input) { ...ProjetoCronogramaElementoFields } } ${PROJETO_CRONOGRAMA_ELEMENTO_FIELDS}`;
