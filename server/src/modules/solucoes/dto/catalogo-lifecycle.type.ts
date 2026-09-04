import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CatalogoVersaoType {
  @Field() id!: string;
  @Field(() => Int) numero!: number;
  @Field() estado!: string;
  @Field() origem!: string;
  @Field(() => Int) revisao!: number;
  @Field() snapshot!: string;
  @Field(() => String, { nullable: true }) motivo?: string | null;
  @Field(() => Date, { nullable: true }) publicadoEm?: Date | null;
}

@ObjectType()
export class CatalogoValidationIssueType {
  @Field() code!: string;
  @Field(() => String, { nullable: true }) field?: string;
  @Field() message!: string;
  @Field() severity!: string;
}

@ObjectType()
export class CatalogoProviderType {
  @Field() key!: string;
  @Field(() => Int) version!: number;
  @Field(() => String, { nullable: true }) documentationKey?: string;
}
