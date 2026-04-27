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
        email
        tipo
        availableSolutions
        empresa {
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

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      nome
      email
      tipo
      availableSolutions
      empresa {
        id
        nome
      }
      empresa {
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
      email
      tipo
      availableSolutions
      empresa {
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
      email
      tipo
      availableSolutions
      empresa {
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
      email
      tipo
      availableSolutions
      empresa {
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
    }
  }
`;
