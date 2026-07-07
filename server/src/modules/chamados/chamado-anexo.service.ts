import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadoAnexoStorageService } from './chamado-anexo-storage.service';
import { ChamadoAuthorizationService } from './chamado-authorization.service';
import { usuarioResumoSelect } from './constants/chamado-prisma.constants';
import { ChamadoAnexoType } from './dto/chamado-anexo.type';
import { toAnexoType } from './mappers/chamado.mapper';
import { assertAnexoBatchLimit, assertAnexoFilesSelected, validateAnexoFile } from './policies/chamado-anexo.policy';
import { isClosedStatus } from './policies/chamado-status.policy';
import { ChamadoQueryService } from './queries/chamado-query.service';
import { ChamadoAnexoRecord, ChamadoUploadFile } from './types/chamado-record.types';

@Injectable()
export class ChamadoAnexoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly anexoStorage: ChamadoAnexoStorageService,
    private readonly chamadoQuery: ChamadoQueryService,
    private readonly authorization: ChamadoAuthorizationService
  ) {}

  async adicionarAnexos(
    chamadoId: string,
    files: ChamadoUploadFile[],
    user: JwtPayload,
    mensagemId?: string | null
  ): Promise<ChamadoAnexoType[]> {
    const empresaId = this.authorization.assertCompanyContext(user);
    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(chamadoId, empresaId);

    await this.authorization.assertCanAttachFiles(user, chamado);

    if (isClosedStatus(chamado.status)) {
      throw new BadRequestException('Chamados arquivados precisam ser reabertos antes de receber anexos.');
    }

    assertAnexoFilesSelected(files);
    assertAnexoBatchLimit(files);

    const normalizedMensagemId = mensagemId?.trim() || null;

    if (normalizedMensagemId) {
      const mensagem = await (this.prisma as never as { chamadoMensagem: { findFirst: Function } }).chamadoMensagem.findFirst({
        where: { id: normalizedMensagemId, chamadoId: chamado.id, empresaId },
        select: { id: true }
      });

      if (!mensagem) {
        throw new BadRequestException('Mensagem do chamado nao encontrada para vincular o anexo.');
      }
    }

    const created: ChamadoAnexoRecord[] = [];

    for (const file of files) {
      validateAnexoFile(file);
      const saved = await this.anexoStorage.save(chamado.id, file);
      const anexo = await (this.prisma as never as { chamadoAnexo: { create: Function } }).chamadoAnexo.create({
        data: {
          chamadoId: chamado.id,
          empresaId,
          autorId: user.sub,
          mensagemId: normalizedMensagemId,
          nomeOriginal: saved.nomeOriginal,
          nomeArquivo: saved.nomeArquivo,
          caminho: saved.caminho,
          mimeType: saved.mimeType,
          tamanho: saved.tamanho
        },
        include: { autor: { select: usuarioResumoSelect } }
      });

      created.push(anexo as ChamadoAnexoRecord);
    }

    await this.prisma.chamado.update({
      where: { id: chamado.id },
      data: { versao: { increment: 1 } }
    });

    await this.prisma.chamadoHistorico.create({
      data: {
        chamadoId: chamado.id,
        empresaId,
        usuarioId: user.sub,
        evento: 'ANEXO',
        observacao: `${created.length} anexo(s) adicionado(s).`
      }
    });

    return created.map((anexo) => toAnexoType(anexo));
  }

  async prepararDownloadAnexo(chamadoId: string, anexoId: string, user: JwtPayload): Promise<{
    caminhoAbsoluto: string;
    nomeOriginal: string;
    mimeType: string;
  }> {
    const empresaId = this.authorization.assertCompanyContext(user);
    const chamado = await this.chamadoQuery.findChamadoRecordOrThrow(chamadoId, empresaId);

    await this.authorization.assertCanViewChamado(user, chamado);

    const anexo = await (this.prisma as never as { chamadoAnexo: { findFirst: Function } }).chamadoAnexo.findFirst({
      where: { id: anexoId, chamadoId: chamado.id, empresaId },
      include: { autor: { select: usuarioResumoSelect } }
    }) as ChamadoAnexoRecord | null;

    if (!anexo) {
      throw new NotFoundException('Anexo nao encontrado.');
    }

    const caminhoAbsoluto = this.anexoStorage.resolve(anexo.caminho);

    if (!existsSync(caminhoAbsoluto)) {
      throw new NotFoundException('Arquivo do anexo nao encontrado no armazenamento.');
    }

    return {
      caminhoAbsoluto,
      nomeOriginal: anexo.nomeOriginal,
      mimeType: anexo.mimeType
    };
  }
}
