import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { GameSession, GameSessionDocument } from './session.schema';
import { ChallengeService } from '../challenge/challenge.service';
import { QuestionService } from '../question/question.service';
import { SubmitAnswerDto, SubmitMoveDto } from './session.dto';
import {
  generateSolvedState,
  scramblePuzzle,
  applyMove,
  isSolved,
} from './puzzle.utils';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(GameSession.name)
    private sessionModel: Model<GameSessionDocument>,
    private challengeService: ChallengeService,
    private questionService: QuestionService,
  ) { }

  async createSession(
    shareCode: string,
    playerName: string,
    existingPlayerId?: string,
  ): Promise<any> {
    const challenge = await this.challengeService.findByShareCode(shareCode);

    // Check challenge status and schedule
    if (challenge.status !== 'active') {
      throw new BadRequestException('Challenge is not active');
    }

    const now = new Date();
    if (challenge.schedule.openAt && now < challenge.schedule.openAt) {
      throw new BadRequestException('Challenge has not started yet');
    }
    if (challenge.schedule.closeAt && now > challenge.schedule.closeAt) {
      throw new BadRequestException('Challenge has ended');
    }

    if (challenge.images.length === 0) {
      throw new BadRequestException('Challenge has no images configured');
    }

    const playerId = existingPlayerId || uuidv4();

    // Randomly assign an image from the challenge
    const randomImage =
      challenge.images[Math.floor(Math.random() * challenge.images.length)];

    // Generate puzzle
    const solvedState = generateSolvedState(challenge.gridSize);
    const scrambleAmount = challenge.gridSize * challenge.gridSize * 20;
    const puzzleState = scramblePuzzle(solvedState, scrambleAmount);

    // Get questions for this session
    const questions = await this.questionService.getQuestionsForGame(
      challenge._id.toString(),
    );

    const session = new this.sessionModel({
      challengeId: challenge._id,
      playerName,
      playerId,
      assignedImageUrl: randomImage.url,
      puzzleState,
      solvedState,
      startedAt: new Date(),
      gameTimeLimit: challenge.settings.gameTimeLimit,
    });

    const saved = await session.save();

    return {
      session: {
        _id: saved._id,
        playerId: saved.playerId,
        playerName: saved.playerName,
        assignedImageUrl: saved.assignedImageUrl,
        puzzleState: saved.puzzleState,
        gridSize: challenge.gridSize,
        gameTimeLimit: challenge.settings.gameTimeLimit,
        questionTimeLimit: challenge.settings.questionTimeLimit,
        startedAt: saved.startedAt,
      },
      questions,
      challenge: {
        _id: challenge._id,
        title: challenge.title,
        description: challenge.description,
        gridSize: challenge.gridSize,
        settings: challenge.settings,
        announcement: challenge.announcement,
      },
    };
  }

  async submitAnswer(
    sessionId: string,
    dto: SubmitAnswerDto,
  ): Promise<{ isCorrect: boolean; canMove: boolean; score: number; speedBonus: number }> {
    const session = await this.findById(sessionId);
    this.validateSessionActive(session);

    // Get the question to check answer
    const question = await this.questionService.findById(dto.questionId);

    const isCorrect = dto.selectedOptionId === question.correctOptionId;

    // Calculate speed bonus for correct answers
    let speedBonus = 0;
    const challenge = await this.challengeService.findById(
      session.challengeId.toString(),
    );

    if (isCorrect) {
      const questionTimeLimitMs = challenge.settings.questionTimeLimit * 1000;
      const timeFraction = 1 - dto.timeSpent / questionTimeLimitMs;
      speedBonus = Math.max(
        0,
        Math.round(challenge.settings.speedBonusMax * timeFraction),
      );
    }

    // Calculate score for this answer
    const answerScore = isCorrect
      ? challenge.settings.basePointsPerCorrect + speedBonus
      : 0;

    // Record the answer
    session.questionsAnswered.push({
      questionId: question._id,
      selectedOptionId: dto.selectedOptionId,
      isCorrect,
      timeSpent: dto.timeSpent,
      speedBonus,
    } as any);

    session.currentQuestionIndex += 1;
    session.totalScore += answerScore;

    // Check if all questions used
    const totalQuestions = challenge.settings.maxQuestionsCount;
    // if (session.currentQuestionIndex >= totalQuestions) {
    //   session.isCompleted = true;
    //   session.completedAt = new Date();
    // }
    if (session.currentQuestionIndex >= totalQuestions) {
      session.currentQuestionIndex = totalQuestions;
    }
    await session.save();

    return {
      isCorrect,
      canMove: isCorrect,
      score: answerScore,
      speedBonus,
    };
  }

  async submitMove(
    sessionId: string,
    dto: SubmitMoveDto,
  ): Promise<{
    puzzleState: number[][];
    isPuzzleSolved: boolean;
    totalScore: number;
    isCompleted: boolean;
  }> {
    const session = await this.findById(sessionId);
    this.validateSessionActive(session);

    const newState = applyMove(session.puzzleState, dto.tileRow, dto.tileCol);
    if (!newState) {
      throw new BadRequestException('Invalid move');
    }

    session.puzzleState = newState;
    session.movesUsed += 1;

    // Check if puzzle is solved
    const solved = isSolved(newState, session.solvedState);
    if (solved) {
      session.isPuzzleSolved = true;
      session.isCompleted = true;
      session.completedAt = new Date();

      // Calculate completion bonus and time remaining bonus
      const challenge = await this.challengeService.findById(
        session.challengeId.toString(),
      );
      session.totalScore += challenge.settings.completionBonus;

      const elapsedSeconds = Math.floor(
        (Date.now() - session.startedAt.getTime()) / 1000,
      );
      const timeRemaining = Math.max(0, session.gameTimeLimit - elapsedSeconds);
      session.totalScore += timeRemaining * challenge.settings.timeRemainingWeight;
    }

    await session.save();

    return {
      puzzleState: session.puzzleState,
      isPuzzleSolved: session.isPuzzleSolved,
      totalScore: session.totalScore,
      isCompleted: session.isCompleted,
    };
  }

  async completeByTimeout(sessionId: string): Promise<GameSessionDocument> {
    const session = await this.findById(sessionId);
    if (!session.isCompleted) {
      session.isCompleted = true;
      session.completedAt = new Date();
      await session.save();
    }
    return session;
  }

  async findById(id: string): Promise<GameSessionDocument> {
    const session = await this.sessionModel.findById(id).exec();
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async findByPlayerId(playerId: string): Promise<GameSessionDocument[]> {
    return this.sessionModel.find({ playerId }).sort({ createdAt: -1 }).exec();
  }

  async findByChallengeId(challengeId: string): Promise<GameSessionDocument[]> {
    return this.sessionModel.find({ challengeId }).sort({ totalScore: -1 }).exec();
  }

  async getSessionStats(challengeId: string) {
    const sessions = await this.sessionModel.find({ challengeId }).exec();
    return {
      totalPlayers: sessions.length,
      playingCount: sessions.filter((s) => !s.isCompleted).length,
      completedCount: sessions.filter((s) => s.isCompleted).length,
      solvedCount: sessions.filter((s) => s.isPuzzleSolved).length,
    };
  }

  private validateSessionActive(session: GameSessionDocument) {
    if (session.isCompleted) {
      throw new BadRequestException('Game session is already completed');
    }

    const elapsedSeconds = Math.floor(
      (Date.now() - session.startedAt.getTime()) / 1000,
    );
    if (elapsedSeconds >= session.gameTimeLimit) {
      session.isCompleted = true;
      session.completedAt = new Date();
      session.save();
      throw new BadRequestException('Time is up');
    }
  }
}
