import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { join, resolve } from 'node:path';
import { validateEnv } from './config/env.validation';
import { HealthResolver } from './health.resolver';
import { AuthModule } from './modules/auth/auth.module';
import { ServicosModule } from './modules/servicos/servicos.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [resolve(process.cwd(), '.env')],
      validate: validateEnv
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
        introspection: configService.get<string>('NODE_ENV') !== 'production',
        playground: configService.get<string>('NODE_ENV') !== 'production'
      })
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ServicosModule
  ],
  providers: [HealthResolver]
})
export class AppModule {}
