import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { isDeclaredUploadTypeAllowed } from '../../common/files/safe-upload.util';
import { RestAuthGuard } from '../auth/guards/rest-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { MAX_PROJETO_ANEXO_FILES, MAX_PROJETO_ANEXO_SIZE_BYTES } from './policies/projeto-anexo.policy';
import { ProjetoComunicacaoService } from './projeto-comunicacao.service';
import { ProjetoUploadFile } from './types/projeto-comunicacao.types';

const PROJETO_ANEXO_MULTIPART_LIMITS = {
  fileSize: MAX_PROJETO_ANEXO_SIZE_BYTES,
  files: MAX_PROJETO_ANEXO_FILES,
  fields: 2,
  parts: MAX_PROJETO_ANEXO_FILES + 2,
  fieldNameSize: 100,
  fieldSize: 256,
  headerPairs: 50,
  fieldNestingDepth: 0
};

@Controller('projetos')
@UseGuards(RestAuthGuard, ThrottlerGuard)
export class ProjetoComunicacaoController {
  constructor(private readonly comunicacao: ProjetoComunicacaoService) {}

  @Post(':id/anexos')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FilesInterceptor('files', MAX_PROJETO_ANEXO_FILES, {
    limits: PROJETO_ANEXO_MULTIPART_LIMITS,
    fileFilter: (_request, file, callback) => {
      if (!isDeclaredUploadTypeAllowed(file.originalname, file.mimetype)) {
        callback(new BadRequestException('Tipo de arquivo nao permitido para anexo.'), false); return;
      }
      callback(null, true);
    }
  }))
  upload(@Param('id') projetoId: string, @UploadedFiles() files: ProjetoUploadFile[] = [],
    @Body('atualizacaoId') atualizacaoId: string | undefined, @Body('comentarioId') comentarioId: string | undefined,
    @Req() request: Request & { user: JwtPayload }) {
    return this.comunicacao.adicionarAnexos(projetoId, files, request.user, atualizacaoId || null, comentarioId || null);
  }

  @Get(':id/anexos/:anexoId/download')
  async download(@Param('id') projetoId: string, @Param('anexoId') anexoId: string,
    @Req() request: Request & { user: JwtPayload }, @Res() response: Response): Promise<void> {
    const anexo = await this.comunicacao.prepararDownload(projetoId, anexoId, request.user);
    response.setHeader('Content-Type', anexo.mimeType);
    response.download(anexo.caminhoAbsoluto, anexo.nomeOriginal);
  }

  @Delete(':id/anexos/:anexoId')
  async remove(@Param('id') projetoId: string, @Param('anexoId') anexoId: string,
    @Req() request: Request & { user: JwtPayload }): Promise<{ success: boolean }> {
    await this.comunicacao.excluirAnexo(projetoId, anexoId, request.user);
    return { success: true };
  }
}
