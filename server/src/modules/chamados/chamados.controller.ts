import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Query,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { isDeclaredUploadTypeAllowed } from '../../common/files/safe-upload.util';
import { RestAuthGuard } from '../auth/guards/rest-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { ChamadosService, ChamadoUploadFile } from './chamados.service';
import { MAX_ANEXO_FILES, MAX_ANEXO_SIZE_BYTES } from './constants/chamado.constants';

const ANEXO_MULTIPART_LIMITS = {
  fileSize: MAX_ANEXO_SIZE_BYTES,
  files: MAX_ANEXO_FILES,
  fields: 1,
  parts: MAX_ANEXO_FILES + 1,
  fieldNameSize: 100,
  fieldSize: 256,
  headerPairs: 50,
  fieldNestingDepth: 0
};

@Controller('chamados')
@UseGuards(RestAuthGuard, ThrottlerGuard)
export class ChamadosController {
  constructor(private readonly chamadosService: ChamadosService) {}

  @Get('relatorios/exportar')
  async exportarRelatorio(
    @Query() query: Record<string, string | undefined>,
    @Req() request: Request & { user: JwtPayload },
    @Res() response: Response
  ): Promise<void> {
    const formato = query.formato === 'xlsx' ? 'xlsx' : 'csv';
    const numberOrUndefined = (value?: string) => value ? Number(value) : undefined;
    const arquivo = await this.chamadosService.exportarRelatorioChamados({
      criadoDe: query.criadoDe, criadoAte: query.criadoAte, responsavelId: query.responsavelId,
      categoriaId: numberOrUndefined(query.categoriaId), prioridadeId: numberOrUndefined(query.prioridadeId),
      slaStatus: query.slaStatus, status: query.status
    }, formato, request.user);
    response.setHeader('Content-Type', arquivo.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${arquivo.nome}"`);
    response.send(arquivo.buffer);
  }
  @Post(':id/anexos')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FilesInterceptor('files', MAX_ANEXO_FILES, {
      limits: ANEXO_MULTIPART_LIMITS,
      fileFilter: (_request, file, callback) => {
        if (!isDeclaredUploadTypeAllowed(file.originalname, file.mimetype)) {
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
