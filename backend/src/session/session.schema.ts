import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GameSessionDocument = GameSession & Document;

@Schema()
export class AnsweredQuestion {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  questionId: Types.ObjectId;

  @Prop({ default: null })
  selectedOptionId: string | null;

  @Prop({ required: true })
  isCorrect: boolean;

  @Prop({ required: true })
  timeSpent: number; // milliseconds

  @Prop({ required: true, default: 0 })
  speedBonus: number;
}

export const AnsweredQuestionSchema = SchemaFactory.createForClass(AnsweredQuestion);

@Schema({ timestamps: true })
export class GameSession {
  @Prop({ type: Types.ObjectId, ref: 'Challenge', required: true })
  challengeId: Types.ObjectId;

  @Prop({ required: true })
  playerName: string;

  @Prop({ required: true })
  playerId: string;

  @Prop({ required: true })
  assignedImageUrl: string;

  @Prop({ type: [[Number]], required: true })
  puzzleState: number[][];

  @Prop({ type: [[Number]], required: true })
  solvedState: number[][];

  @Prop({ type: [AnsweredQuestionSchema], default: [] })
  questionsAnswered: AnsweredQuestion[];

  @Prop({ default: 0 })
  movesUsed: number;

  @Prop({ default: 0 })
  currentQuestionIndex: number;

  @Prop({ default: 0 })
  totalScore: number;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ default: false })
  isPuzzleSolved: boolean;

  @Prop({ required: true })
  startedAt: Date;

  @Prop({ default: null })
  completedAt: Date | null;

  @Prop({ required: true })
  gameTimeLimit: number; // seconds - copied from challenge at session start
}

export const GameSessionSchema = SchemaFactory.createForClass(GameSession);
