import { BadRequestException } from '@nestjs/common';

export type ProjetoDependenciaAresta = {
  bloqueadorId: string;
  bloqueadoId: string;
};

export function assertProjetoDependenciaSemCiclo(
  dependencias: ProjetoDependenciaAresta[],
  bloqueadorId: string,
  bloqueadoId: string
): void {
  const grafo = new Map<string, string[]>();
  for (const dependencia of dependencias) {
    grafo.set(dependencia.bloqueadorId, [
      ...(grafo.get(dependencia.bloqueadorId) ?? []),
      dependencia.bloqueadoId
    ]);
  }

  const pendentes = [bloqueadoId];
  const visitados = new Set<string>();
  while (pendentes.length) {
    const atual = pendentes.pop()!;
    if (atual === bloqueadorId) {
      throw new BadRequestException(
        'A dependencia criaria um ciclo no cronograma.'
      );
    }
    if (visitados.has(atual)) continue;
    visitados.add(atual);
    pendentes.push(...(grafo.get(atual) ?? []));
  }
}
