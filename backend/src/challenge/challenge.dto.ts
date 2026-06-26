import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ChallengeSettingsDto {
  @IsNumber()
  @Min(5)
  @Max(100)
  @IsOptional()
  maxQuestionsCount?: number;

  @IsNumber()
  @Min(5)
  @Max(300)
  @IsOptional()
  questionTimeLimit?: number;

  @IsNumber()
  @Min(60)
  @Max(3600)
  @IsOptional()
  gameTimeLimit?: number;

  @IsNumber()
  @Min(10)
  @IsOptional()
  basePointsPerCorrect?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  speedBonusMax?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  completionBonus?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  timeRemainingWeight?: number;
}

export class ChallengeScheduleDto {
  @IsOptional()
  @IsString()
  openAt?: string;

  @IsOptional()
  @IsString()
  closeAt?: string;
}

export class CreateChallengeDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(3)
  @Max(8)
  gridSize: number;

  @ValidateNested()
  @Type(() => ChallengeSettingsDto)
  @IsOptional()
  settings?: ChallengeSettingsDto;

  @ValidateNested()
  @Type(() => ChallengeScheduleDto)
  @IsOptional()
  schedule?: ChallengeScheduleDto;

  @IsString()
  @IsOptional()
  announcement?: string;

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'active', 'closed'])
  status?: string;
}

export class UpdateChallengeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(3)
  @Max(8)
  @IsOptional()
  gridSize?: number;

  @ValidateNested()
  @Type(() => ChallengeSettingsDto)
  @IsOptional()
  settings?: ChallengeSettingsDto;

  @ValidateNested()
  @Type(() => ChallengeScheduleDto)
  @IsOptional()
  schedule?: ChallengeScheduleDto;

  @IsString()
  @IsOptional()
  announcement?: string;

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'active', 'closed'])
  status?: string;
}
