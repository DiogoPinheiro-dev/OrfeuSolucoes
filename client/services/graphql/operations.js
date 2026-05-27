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
      solucaoIds
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
      solucaoIds
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
      solucaoIds
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
