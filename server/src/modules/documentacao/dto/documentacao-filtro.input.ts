import { Field, InputType } from '@nestjs/graphql';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

@InputType()
export class DocumentacaoFiltroInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(['sistema', 'solucao'])
  categoria?: 'sistema' | 'solucao';

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  solucao?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+\.[a-z0-9-]+$/)
  registryKey?: string;
}
