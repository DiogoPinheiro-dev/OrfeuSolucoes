import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '../../config/env.validation';
import { PrismaModule } from '../../prisma/prisma.module';
import { InstalacaoCoreModule } from './instalacao-core.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    InstalacaoCoreModule
  ]
})
export class InstalacaoSeedModule {}
