import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeaderboardEntryDocument = LeaderboardEntry & Document;

@Schema({ timestamps: true })
export class LeaderboardEntry {
  @Prop({ type: Types.ObjectId, ref: 'Challenge', default: null })
  challengeId: Types.ObjectId | null;

  @Prop({ required: true })
  playerId: string;

  @Prop({ required: true })
  playerName: string;

  @Prop({ required: true, default: 0 })
  totalScore: number;

  @Prop({ default: 0 })
  correctAnswers: number;

  @Prop({ default: false })
  puzzleSolved: boolean;

  @Prop({ default: 0 })
  timeSpent: number; // seconds

  @Prop({ default: 0 })
  rank: number;
}

export const LeaderboardEntrySchema = SchemaFactory.createForClass(LeaderboardEntry);

// Index for efficient leaderboard queries
LeaderboardEntrySchema.index({ challengeId: 1, totalScore: -1 });
LeaderboardEntrySchema.index({ challengeId: null, totalScore: -1 });
