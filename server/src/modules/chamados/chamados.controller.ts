import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { extname } from 'node:path';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadosService, ChamadoUploadFile } from './chamados.service';

const MAX_ANEXO_FILES = 5;
const MAX_ANEXO_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_ANEXO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]);
const ALLOWED_ANEXO_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.txt']);

@Controller('chamados')
@UseGuards(AuthGuard('jwt'))
export class ChamadosController {
  constructor(private readonly chamadosService: ChamadosService) {}

  @Post(':id/anexos')
  @UseInterceptors(
    FilesInterceptor('files', MAX_ANEXO_FILES, {
      limits: {
        fileSize: MAX_ANEXO_SIZE_BYTES,
        files: MAX_ANEXO_FILES
      },
      fileFilter: (_request, file, callback) => {
        const extension = extname(file.originalname || '').toLowerCase();
        const isAllowed =
          ALLOWED_ANEXO_MIME_TYPES.has(file.mimetype) && ALLOWED_ANEXO_EXTENSIONS.has(extension);

        if (!isAllowed) {
          callback(new BadRequestException('Tipo de arquivo não permitido para anexo.'), false);
          return;
        }

        callback(null, true);
      }
    })
  )
  async uploadAnexos(
    @Param('id') chamadoId: string,
    @UploadedFiles() files: ChamadoUploadFile[] = [],
    @Body('mensagemId') mensagemId: string | undefined,
    @Req() request: Request & { user: JwtPayload }
  ) {
    if (!files.length) {
      throw new BadRequestException('Selecione ao menos um arquivo para anexar.');
    }

    return this.chamadosService.adicionarAnexos(chamadoId, files, request.user, mensagemId || null);
  }

  @Get(':id/anexos/:anexoId/download')
  async downloadAnexo(
    @Param('id') chamadoId: string,
    @Param('anexoId') anexoId: string,
    @Req() request: Request & { user: JwtPayload },
    @Res() response: Response
  ): Promise<void> {
    const anexo = await this.chamadosService.prepararDownloadAnexo(chamadoId, anexoId, request.user);

    response.setHeader('Content-Type', anexo.mimeType);
    response.download(anexo.caminhoAbsoluto, anexo.nomeOriginal);
  }
}
