import { IsString, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionOptionDto {
  @IsString()
  id: string;

  @IsString()
  text: string;
}

export class CreateQuestionDto {
  @IsString()
  questionText: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options: QuestionOptionDto[];

  @IsString()
  correctOptionId: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class BulkCreateQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}
