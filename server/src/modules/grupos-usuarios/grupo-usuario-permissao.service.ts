import { Injectable } from '@nestjs/common';
import { FuncionalidadePermissao } from '../solucoes/solucoes.service';

@Injectable()
export class GrupoUsuarioPermissaoService {
  resolveFuncionalidadePermissoes(
    funcionalidadeIds: number[],
    permissoes: FuncionalidadePermissao[] | undefined,
    defaults: {
      podeVisualizar?: boolean;
      podeIncluir?: boolean;
      podeAlterar?: boolean;
      podeExcluir?: boolean;
    }
  ): FuncionalidadePermissao[] {
    const permissoesByFuncionalidadeId = new Map(
      (permissoes ?? []).map((permissao) => [permissao.funcionalidadeId, permissao])
    );

    return [...new Set(funcionalidadeIds)].map((funcionalidadeId) => {
      const permissao = permissoesByFuncionalidadeId.get(funcionalidadeId);

      return {
        funcionalidadeId,
        podeVisualizar: permissao?.podeVisualizar ?? defaults.podeVisualizar ?? true,
        podeIncluir: permissao?.podeIncluir ?? defaults.podeIncluir ?? false,
        podeAlterar: permissao?.podeAlterar ?? defaults.podeAlterar ?? false,
        podeExcluir: permissao?.podeExcluir ?? defaults.podeExcluir ?? false,
        acoes: permissao?.acoes ?? []
      };
    });
  }
}
