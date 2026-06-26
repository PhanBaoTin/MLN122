import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import ShortUniqueId from 'short-unique-id';
import { Challenge, ChallengeDocument } from './challenge.schema';
import { CreateChallengeDto, UpdateChallengeDto } from './challenge.dto';

const uid = new ShortUniqueId({ length: 8 });

@Injectable()
export class ChallengeService {
  constructor(
    @InjectModel(Challenge.name) private challengeModel: Model<ChallengeDocument>,
  ) { }

  async create(dto: CreateChallengeDto, adminId: string): Promise<ChallengeDocument> {
    const shareCode = uid.rnd().toUpperCase();
    const challenge = new this.challengeModel({
      ...dto,
      shareCode,
      createdBy: adminId,
      schedule: dto.schedule
        ? {
          openAt: dto.schedule.openAt ? new Date(dto.schedule.openAt) : null,
          closeAt: dto.schedule.closeAt ? new Date(dto.schedule.closeAt) : null,
        }
        : { openAt: null, closeAt: null },
    });
    return challenge.save();
  }

  async findAll(): Promise<ChallengeDocument[]> {
    return this.challengeModel.find().sort({ createdAt: -1 }).exec();
  }

  // 🔒 Giữ nguyên hàm này cho Admin (Trả về ID thô, không populate)
  async findById(id: string): Promise<ChallengeDocument> {
    const challenge = await this.challengeModel.findById(id).exec();
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  // 🔓 Tạo hàm mới này dành riêng cho Player ở GamePlay
  async findWithQuestions(id: string): Promise<ChallengeDocument> {
    const challenge = await this.challengeModel
      .findById(id)
      .populate('questions') // Chỉ populate ở đây
      .exec();
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async findByShareCode(shareCode: string): Promise<ChallengeDocument> {
    const challenge = await this.challengeModel.findOne({ shareCode }).exec();
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async update(id: string, dto: UpdateChallengeDto): Promise<ChallengeDocument> {
    const updateData: any = { ...dto };
    if (dto.schedule) {
      updateData.schedule = {
        openAt: dto.schedule.openAt ? new Date(dto.schedule.openAt) : null,
        closeAt: dto.schedule.closeAt ? new Date(dto.schedule.closeAt) : null,
      };
    }
    const challenge = await this.challengeModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async delete(id: string): Promise<void> {
    const result = await this.challengeModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Challenge not found');
  }

  async updateStatus(id: string, status: string): Promise<ChallengeDocument> {
    const challenge = await this.challengeModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async addImage(id: string, imageUrl: string, originalName: string): Promise<ChallengeDocument> {
    const challenge = await this.challengeModel.findByIdAndUpdate(
      id,
      { $push: { images: { url: imageUrl, originalName } } },
      { new: true },
    ).exec();
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async removeImage(id: string, imageIndex: number): Promise<ChallengeDocument> {
    const challenge = await this.findById(id);
    challenge.images.splice(imageIndex, 1);
    return challenge.save();
  }

  async addQuestionId(challengeId: string, questionId: string): Promise<void> {
    await this.challengeModel.findByIdAndUpdate(
      challengeId,
      { $push: { questions: questionId } },
    ).exec();
  }

  async removeQuestionId(challengeId: string, questionId: string): Promise<void> {
    await this.challengeModel.findByIdAndUpdate(
      challengeId,
      { $pull: { questions: questionId } },
    ).exec();
  }
}
