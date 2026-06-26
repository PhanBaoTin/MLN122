import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ type: Types.ObjectId, ref: 'Challenge', required: true })
  challengeId: Types.ObjectId;

  @Prop({ required: true })
  playerId: string;

  @Prop({ required: true })
  playerName: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: ['player', 'admin', 'system'], default: 'player' })
  type: string;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
