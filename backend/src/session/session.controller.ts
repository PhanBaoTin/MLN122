import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SessionService } from './session.service';
import { JoinChallengeDto, SubmitAnswerDto, SubmitMoveDto } from './session.dto';

@Controller()
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('play/:shareCode/join')
  async joinChallenge(
    @Param('shareCode') shareCode: string,
    @Body() dto: JoinChallengeDto,
  ) {
    return this.sessionService.createSession(
      shareCode,
      dto.playerName,
      dto.playerId,
    );
  }

  @Post('sessions/:id/answer')
  async submitAnswer(
    @Param('id') id: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.sessionService.submitAnswer(id, dto);
  }

  @Post('sessions/:id/move')
  async submitMove(
    @Param('id') id: string,
    @Body() dto: SubmitMoveDto,
  ) {
    return this.sessionService.submitMove(id, dto);
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string) {
    return this.sessionService.findById(id);
  }

  @Post('sessions/:id/timeout')
  async completeByTimeout(@Param('id') id: string) {
    return this.sessionService.completeByTimeout(id);
  }
}
