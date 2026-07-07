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
    status
    criadoEm
    atualizadoEm
    primeiraRespostaEm
    resolvidoEm
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
