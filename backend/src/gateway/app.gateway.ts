import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat/chat.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { SessionService } from '../session/session.service';

interface LobbyPlayer {
  playerId: string;
  playerName: string;
  socketId: string;
  status: 'waiting' | 'playing' | 'completed';
  joinedAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // challengeId -> Map<playerId, LobbyPlayer>
  private lobbies: Map<string, Map<string, LobbyPlayer>> = new Map();

  constructor(
    private chatService: ChatService,
    private leaderboardService: LeaderboardService,
    private sessionService: SessionService,
  ) {}

  afterInit() {
    console.log('🔌 WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Remove player from all lobbies
    this.lobbies.forEach((players, challengeId) => {
      players.forEach((player, playerId) => {
        if (player.socketId === client.id) {
          players.delete(playerId);
          this.broadcastLobbyUpdate(challengeId);
          this.server.to(`lobby:${challengeId}`).emit('lobby:playerLeft', {
            playerId,
            playerName: player.playerName,
          });
        }
      });
    });
  }

  @SubscribeMessage('lobby:join')
  handleLobbyJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { challengeId: string; playerName: string; playerId: string },
  ) {
    const { challengeId, playerName, playerId } = data;

    // Join the socket room
    client.join(`lobby:${challengeId}`);

    // Add to lobby tracker
    if (!this.lobbies.has(challengeId)) {
      this.lobbies.set(challengeId, new Map());
    }

    const lobby = this.lobbies.get(challengeId)!;
    lobby.set(playerId, {
      playerId,
      playerName,
      socketId: client.id,
      status: 'waiting',
      joinedAt: new Date(),
    });

    // Broadcast updated player list and announce new player
    this.broadcastLobbyUpdate(challengeId);
    this.server.to(`lobby:${challengeId}`).emit('lobby:playerJoined', {
      playerId,
      playerName,
    });
  }

  @SubscribeMessage('lobby:leave')
  handleLobbyLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { challengeId: string; playerId: string },
  ) {
    const { challengeId, playerId } = data;
    client.leave(`lobby:${challengeId}`);

    const lobby = this.lobbies.get(challengeId);
    if (lobby) {
      const player = lobby.get(playerId);
      lobby.delete(playerId);
      this.broadcastLobbyUpdate(challengeId);
      if (player) {
        this.server.to(`lobby:${challengeId}`).emit('lobby:playerLeft', {
          playerId,
          playerName: player.playerName,
        });
      }
    }
  }

  @SubscribeMessage('lobby:updateStatus')
  handleStatusUpdate(
    @MessageBody()
    data: {
      challengeId: string;
      playerId: string;
      status: 'waiting' | 'playing' | 'completed';
    },
  ) {
    const { challengeId, playerId, status } = data;
    const lobby = this.lobbies.get(challengeId);
    if (lobby && lobby.has(playerId)) {
      const player = lobby.get(playerId)!;
      player.status = status;
      this.broadcastLobbyUpdate(challengeId);
      this.server.to(`lobby:${challengeId}`).emit('lobby:playerStatus', {
        playerId,
        playerName: player.playerName,
        status,
      });
    }
  }

  @SubscribeMessage('chat:send')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      challengeId: string;
      playerId: string;
      playerName: string;
      message: string;
    },
  ) {
    const { challengeId, playerId, playerName, message } = data;

    // Save to database
    const chatMessage = await this.chatService.createMessage({
      challengeId,
      playerId,
      playerName,
      message,
    });

    // Broadcast to room
    this.server.to(`lobby:${challengeId}`).emit('chat:message', {
      _id: chatMessage._id,
      playerId,
      playerName,
      message,
      type: 'player',
      createdAt: (chatMessage as any).createdAt,
    });
  }

  @SubscribeMessage('chat:getHistory')
  async handleChatHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { challengeId: string },
  ) {
    const messages = await this.chatService.getMessages(data.challengeId);
    client.emit('chat:history', messages);
  }

  @SubscribeMessage('game:started')
  handleGameStarted(
    @MessageBody()
    data: { challengeId: string; playerId: string; playerName: string },
  ) {
    this.server.to(`lobby:${data.challengeId}`).emit('game:started', {
      playerId: data.playerId,
      playerName: data.playerName,
    });

    // Update lobby status
    this.handleStatusUpdate({
      challengeId: data.challengeId,
      playerId: data.playerId,
      status: 'playing',
    });
  }

  @SubscribeMessage('game:completed')
  async handleGameCompleted(
    @MessageBody()
    data: {
      challengeId: string;
      playerId: string;
      playerName: string;
      totalScore: number;
      correctAnswers: number;
      puzzleSolved: boolean;
      timeSpent: number;
    },
  ) {
    // Update leaderboard
    await this.leaderboardService.upsertEntry({
      challengeId: data.challengeId,
      playerId: data.playerId,
      playerName: data.playerName,
      totalScore: data.totalScore,
      correctAnswers: data.correctAnswers,
      puzzleSolved: data.puzzleSolved,
      timeSpent: data.timeSpent,
    });

    // Broadcast game completion
    this.server.to(`lobby:${data.challengeId}`).emit('game:completed', {
      playerId: data.playerId,
      playerName: data.playerName,
      totalScore: data.totalScore,
      puzzleSolved: data.puzzleSolved,
    });

    // Broadcast updated leaderboard
    const leaderboard = await this.leaderboardService.getChallengeLeaderboard(
      data.challengeId,
    );
    this.server
      .to(`lobby:${data.challengeId}`)
      .emit('leaderboard:update', leaderboard);

    // Update lobby status
    this.handleStatusUpdate({
      challengeId: data.challengeId,
      playerId: data.playerId,
      status: 'completed',
    });
  }

  // Admin sends announcement
  @SubscribeMessage('admin:announce')
  handleAdminAnnouncement(
    @MessageBody() data: { challengeId: string; message: string },
  ) {
    this.server.to(`lobby:${data.challengeId}`).emit('chat:adminAnnounce', {
      message: data.message,
      createdAt: new Date(),
    });
  }

  private broadcastLobbyUpdate(challengeId: string) {
    const lobby = this.lobbies.get(challengeId);
    if (!lobby) return;

    const players = Array.from(lobby.values());
    const stats = {
      online: players.length,
      waiting: players.filter((p) => p.status === 'waiting').length,
      playing: players.filter((p) => p.status === 'playing').length,
      completed: players.filter((p) => p.status === 'completed').length,
    };

    this.server.to(`lobby:${challengeId}`).emit('lobby:playerList', players);
    this.server.to(`lobby:${challengeId}`).emit('lobby:stats', stats);
  }

  /**
   * Called by Admin endpoint to broadcast game start to all players in the lobby.
   * Each player receives their own sessionId so they can navigate to the correct game.
   */
  broadcastGameStart(challengeId: string, playerSessions: { playerId: string; sessionId: string }[]) {
    this.server.to(`lobby:${challengeId}`).emit('game:adminStart', {
      playerSessions,
    });

    // Update all lobby players to 'playing' status
    const lobby = this.lobbies.get(challengeId);
    if (lobby) {
      lobby.forEach((player) => {
        player.status = 'playing';
      });
      this.broadcastLobbyUpdate(challengeId);
    }
  }

  /**
   * Returns the list of players currently in the lobby for a given challenge.
   */
  getLobbyPlayers(challengeId: string) {
    const lobby = this.lobbies.get(challengeId);
    if (!lobby) return [];
    return Array.from(lobby.values());
  }
}
