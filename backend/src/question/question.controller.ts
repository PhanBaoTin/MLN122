import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto, BulkCreateQuestionsDto } from './question.dto';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';

@Controller()
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @UseGuards(JwtAuthGuard)
  @Post('challenges/:challengeId/questions')
  async create(
    @Param('challengeId') challengeId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionService.create(challengeId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('challenges/:challengeId/questions/bulk')
  async bulkCreate(
    @Param('challengeId') challengeId: string,
    @Body() dto: BulkCreateQuestionsDto,
  ) {
    return this.questionService.bulkCreate(challengeId, dto.questions);
  }

  @UseGuards(JwtAuthGuard)
  @Get('challenges/:challengeId/questions')
  async findByChallengeId(@Param('challengeId') challengeId: string) {
    return this.questionService.findByChallengeId(challengeId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('questions/:id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateQuestionDto>) {
    return this.questionService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('questions/:id')
  async delete(@Param('id') id: string) {
    await this.questionService.delete(id);
    return { message: 'Question deleted' };
  }
}
