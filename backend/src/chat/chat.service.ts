import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from './chat.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessage.name)
    private chatMessageModel: Model<ChatMessageDocument>,
  ) {}

  async createMessage(data: {
    challengeId: string;
    playerId: string;
    playerName: string;
    message: string;
    type?: string;
  }): Promise<ChatMessageDocument> {
    const chatMessage = new this.chatMessageModel({
      ...data,
      type: data.type || 'player',
    });
    return chatMessage.save();
  }

  async getMessages(
    challengeId: string,
    limit: number = 50,
  ): Promise<ChatMessageDocument[]> {
    return this.chatMessageModel
      .find({ challengeId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec()
      .then((msgs) => msgs.reverse());
  }
}
