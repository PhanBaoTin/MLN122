import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question, QuestionDocument } from './question.schema';
import { CreateQuestionDto } from './question.dto';
import { ChallengeService } from '../challenge/challenge.service';

@Injectable()
export class QuestionService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    private challengeService: ChallengeService,
  ) {}

  async create(challengeId: string, dto: CreateQuestionDto): Promise<QuestionDocument> {
    // Verify challenge exists
    await this.challengeService.findById(challengeId);

    const question = new this.questionModel({
      ...dto,
      challengeId,
    });
    const saved = await question.save();

    // Add question reference to challenge
    await this.challengeService.addQuestionId(challengeId, saved._id.toString());

    return saved;
  }

  async bulkCreate(challengeId: string, dtos: CreateQuestionDto[]): Promise<QuestionDocument[]> {
    await this.challengeService.findById(challengeId);

    const questions = dtos.map((dto, index) => ({
      ...dto,
      challengeId,
      order: dto.order ?? index,
    }));

    const saved = await this.questionModel.insertMany(questions);

    // Add all question references to challenge
    for (const q of saved) {
      await this.challengeService.addQuestionId(challengeId, (q as any)._id.toString());
    }

    return saved as unknown as QuestionDocument[];
  }

  async findByChallengeId(challengeId: string): Promise<QuestionDocument[]> {
    return this.questionModel.find({ challengeId }).sort({ order: 1 }).exec();
  }

  async findById(id: string): Promise<QuestionDocument> {
    const question = await this.questionModel.findById(id).exec();
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  async update(id: string, dto: Partial<CreateQuestionDto>): Promise<QuestionDocument> {
    const question = await this.questionModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  async delete(id: string): Promise<void> {
    const question = await this.questionModel.findById(id).exec();
    if (!question) throw new NotFoundException('Question not found');

    await this.challengeService.removeQuestionId(
      question.challengeId.toString(),
      id,
    );
    await this.questionModel.findByIdAndDelete(id).exec();
  }

  // Get questions for a game session (without correct answers for player view)
  async getQuestionsForGame(challengeId: string): Promise<any[]> {
    const questions = await this.findByChallengeId(challengeId);
    return questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      order: q.order,
      // correctOptionId is deliberately excluded
    }));
  }
}
