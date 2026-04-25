import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmpresasResolver } from './empresas.resolver';
import { EmpresasService } from './empresas.service';

@Module({
  imports: [PrismaModule],
  providers: [EmpresasResolver, EmpresasService],
  exports: [EmpresasService]
})
export class EmpresasModule {}
