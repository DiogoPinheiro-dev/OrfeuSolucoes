import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsUUID, ValidateNested } from 'class-validator';

@InputType()
export class ChamadoResponsavelSolucaoInput {
  @Field(() => Int)
  @IsInt()
  solucaoId!: number;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  responsavelGeral?: boolean | null;

  @Field(() => [Int], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  funcionalidadeIds?: number[] | null;
}

@InputType()
export class CreateChamadoResponsavelInput {
  @Field(() => String, { nullable: true, defaultValue: 'USUARIO' })
  @IsOptional()
  @IsIn(['USUARIO', 'GRUPO'])
  tipo?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  usuarioId?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  grupoId?: number | null;

  @Field(() => [ChamadoResponsavelSolucaoInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChamadoResponsavelSolucaoInput)
  solucoes!: ChamadoResponsavelSolucaoInput[];

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

@InputType()
export class UpdateChamadoResponsavelInput {
  @Field(() => Int)
  @IsInt()
  id!: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(['USUARIO', 'GRUPO'])
  tipo?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  usuarioId?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  grupoId?: number | null;

  @Field(() => [ChamadoResponsavelSolucaoInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChamadoResponsavelSolucaoInput)
  solucoes?: ChamadoResponsavelSolucaoInput[] | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean | null;
}