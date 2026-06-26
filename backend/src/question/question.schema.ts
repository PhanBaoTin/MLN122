import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema()
export class QuestionOption {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  text: string;
}

export const QuestionOptionSchema = SchemaFactory.createForClass(QuestionOption);

@Schema({ timestamps: true })
export class Question {
  @Prop({ type: Types.ObjectId, ref: 'Challenge', required: true })
  challengeId: Types.ObjectId;

  @Prop({ required: true })
  questionText: string;

  @Prop({ type: [QuestionOptionSchema], required: true })
  options: QuestionOption[];

  @Prop({ required: true })
  correctOptionId: string;

  @Prop({ required: true, default: 0 })
  order: number;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
