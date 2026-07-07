import { Empresa } from '@prisma/client';
import { UserType } from '../dto/user.type';
import { hasFullGroupAccess, isSystemAdmin } from '../policies/user.policy';
import { UsuarioWithRole } from '../types/user-record.types';

export function toUserType(user: UsuarioWithRole): UserType {
  const empresas = user.empresasVinculadas ?? user.empresas?.map((vinculo) => vinculo.empresa).filter((empresa): empresa is Empresa => !!empresa) ?? [];
  const empresa = user.empresa ?? empresas[0] ?? null;
  const isAdminGroup = hasFullGroupAccess(user.grupo);
  const empresasType = empresas.map((empresaVinculada) => ({
    id: empresaVinculada.id,
    nome: empresaVinculada.nome ?? null,
    acessoEcommerce: empresaVinculada.acessoEcommerce ?? false,
    acessoProjetos: empresaVinculada.acessoProjetos ?? false,
    acessoHoras: empresaVinculada.acessoHoras ?? false,
    padraoSistema: empresaVinculada.padraoSistema ?? false,
    solucaoIds: [],
    solucaoSlugs: [],
    solucaoNomes: [],
    funcionalidadeIds: []
  }));

  return {
    id: user.id,
    nome: user.nome,
    login: user.login ?? null,
    email: user.email,
    empresa: empresa
      ? {
          id: empresa.id,
          nome: empresa.nome ?? null,
          acessoEcommerce: empresa.acessoEcommerce ?? false,
          acessoProjetos: empresa.acessoProjetos ?? false,
          acessoHoras: empresa.acessoHoras ?? false,
          padraoSistema: empresa.padraoSistema ?? false,
          solucaoIds: [],
          solucaoSlugs: [],
          solucaoNomes: [],
          funcionalidadeIds: []
        }
      : null,
    empresas: empresasType,
    grupo: user.grupo
      ? {
          id: user.grupo.id,
          nome: user.grupo.nome,
          descricao: user.grupo.descricao ?? null,
          acessoEcommerce: user.grupo.acessoEcommerce ?? false,
          acessoProjetos: user.grupo.acessoProjetos ?? false,
          acessoHoras: user.grupo.acessoHoras ?? false,
          acessoConfigurador: user.grupo.acessoConfigurador ?? false,
          padraoSistema: user.grupo.padraoSistema ?? false,
          podeVisualizar: isAdminGroup || (user.grupo.podeVisualizar ?? true),
          podeIncluir: isAdminGroup || (user.grupo.podeIncluir ?? false),
          podeAlterar: isAdminGroup || (user.grupo.podeAlterar ?? false),
          podeExcluir: isAdminGroup || (user.grupo.podeExcluir ?? false),
          solucaoIds: [],
          funcionalidadeIds: [],
          funcionalidadePermissoes: []
        }
      : null,
    podeVisualizar: isAdminGroup || (user.grupo?.podeVisualizar ?? false),
    podeIncluir: isAdminGroup || (user.grupo?.podeIncluir ?? false),
    podeAlterar: isAdminGroup || (user.grupo?.podeAlterar ?? false),
    podeExcluir: isAdminGroup || (user.grupo?.podeExcluir ?? false),
    deveAlterarSenha: user.deveAlterarSenha ?? false,
    padraoSistema: user.padraoSistema ?? false,
    availableSolutions: resolveDefaultSolutions(user)
  };
}

export function resolveDefaultSolutions(user: UsuarioWithRole): string[] {
  const grupo = user.grupo;
  const canAccessConfigurador = isSystemAdmin(user);

  if (hasFullGroupAccess(grupo)) {
    return [
      'ecommerce',
      'projetos',
      'horas',
      canAccessConfigurador ? 'configurador' : null
    ].filter((solution): solution is string => !!solution);
  }

  if (grupo) {
    return [
      grupo.acessoEcommerce ? 'ecommerce' : null,
      grupo.acessoProjetos ? 'projetos' : null,
      grupo.acessoHoras ? 'horas' : null,
      grupo.acessoConfigurador && canAccessConfigurador ? 'configurador' : null
    ].filter((solution): solution is string => !!solution);
  }

  return ['ecommerce'];
}
