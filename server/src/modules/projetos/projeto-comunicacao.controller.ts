import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { extname } from 'node:path';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ALLOWED_PROJETO_ANEXO_EXTENSIONS, ALLOWED_PROJETO_ANEXO_MIME_TYPES, MAX_PROJETO_ANEXO_FILES, MAX_PROJETO_ANEXO_SIZE_BYTES } from './policies/projeto-anexo.policy';
import { ProjetoComunicacaoService } from './projeto-comunicacao.service';
import { ProjetoUploadFile } from './types/projeto-comunicacao.types';

@Controller('projetos')
@UseGuards(AuthGuard('jwt'))
export class ProjetoComunicacaoController {
  constructor(private readonly comunicacao: ProjetoComunicacaoService) {}

  @Post(':id/anexos')
  @UseInterceptors(FilesInterceptor('files', MAX_PROJETO_ANEXO_FILES, {
    limits: { fileSize: MAX_PROJETO_ANEXO_SIZE_BYTES, files: MAX_PROJETO_ANEXO_FILES },
    fileFilter: (_request, file, callback) => {
      const extension = extname(file.originalname || '').toLowerCase();
      if (!ALLOWED_PROJETO_ANEXO_MIME_TYPES.has(file.mimetype) || !ALLOWED_PROJETO_ANEXO_EXTENSIONS.has(extension)) {
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