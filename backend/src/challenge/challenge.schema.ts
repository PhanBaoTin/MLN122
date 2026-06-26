import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChallengeDocument = Challenge & Document;

@Schema()
export class ChallengeImage {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  originalName: string;
}

export const ChallengeImageSchema = SchemaFactory.createForClass(ChallengeImage);

@Schema()
export class ChallengeSettings {
  @Prop({ required: true, default: 20 })
  maxQuestionsCount: number;

  @Prop({ required: true, default: 30 })
  questionTimeLimit: number; // seconds per question

  @Prop({ required: true, default: 600 })
  gameTimeLimit: number; // seconds total

  @Prop({ required: true, default: 100 })
  basePointsPerCorrect: number;

  @Prop({ required: true, default: 50 })
  speedBonusMax: number;

  @Prop({ required: true, default: 500 })
  completionBonus: number;

  @Prop({ required: true, default: 2 })
  timeRemainingWeight: number; // points per second remaining
}

export const ChallengeSettingsSchema = SchemaFactory.createForClass(ChallengeSettings);

@Schema()
export class ChallengeSchedule {
  @Prop({ default: null })
  openAt: Date | null;

  @Prop({ default: null })
  closeAt: Date | null;
}

export const ChallengeScheduleSchema = SchemaFactory.createForClass(ChallengeSchedule);

@Schema({ timestamps: true })
export class Challenge {
  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: [ChallengeImageSchema], default: [] })
  images: ChallengeImage[];

  @Prop({ required: true, default: 3 })
  gridSize: number; // 3 = 3x3, 4 = 4x4, etc.

  @Prop({ type: [Types.ObjectId], ref: 'Question', default: [] })
  questions: Types.ObjectId[];

  @Prop({ type: ChallengeSettingsSchema, default: () => ({}) })
  settings: ChallengeSettings;

  @Prop({ type: ChallengeScheduleSchema, default: () => ({}) })
  schedule: ChallengeSchedule;

  @Prop({ default: '' })
  announcement: string;

  @Prop({ required: true, enum: ['draft', 'active', 'closed'], default: 'draft' })
  status: string;

  @Prop({ required: true, unique: true })
  shareCode: string;

  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true })
  createdBy: Types.ObjectId;
}

export const ChallengeSchema = SchemaFactory.createForClass(Challenge);
