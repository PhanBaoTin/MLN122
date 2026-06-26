import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class JoinChallengeDto {
  @IsString()
  playerName: string;

  @IsString()
  @IsOptional()
  playerId?: string; // Reuse existing player ID if returning
}

export class SubmitAnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  @IsOptional()
  selectedOptionId: string | null;

  @IsNumber()
  timeSpent: number; // milliseconds
}

export class SubmitMoveDto {
  @IsNumber()
  tileRow: number;

  @IsNumber()
  tileCol: number;
}
