import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from '../messages/messages.service';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { MessageResponseDto } from '../messages/dto/message-response.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

interface TypingData {
  conversationId?: string;
  receiverId?: string;
  isTyping: boolean;
}

interface OnlineUser {
  userId: string;
  socketId: string;
  username: string;
  connectedAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: '*', // In production, specify your frontend URL
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private onlineUsers: Map<string, OnlineUser> = new Map();
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret') || 'default-secret',
      });

      // Attach user info to socket
      client.userId = payload.sub;
      client.username = payload.username;

      // Track online user
      const onlineUser: OnlineUser = {
        userId: client.userId!,
        socketId: client.id,
        username: client.username!,
        connectedAt: new Date(),
      };

      this.onlineUsers.set(client.id, onlineUser);

      // Track user's sockets (a user can have multiple connections)
      if (!this.userSockets.has(client.userId!)) {
        this.userSockets.set(client.userId!, new Set());
      }
      this.userSockets.get(client.userId!)!.add(client.id);

      // Join user's personal room
      client.join(`user:${client.userId}`);

      this.logger.log(
        `Client connected: ${client.id} (User: ${client.username})`,
      );

      // Notify others that user is online
      this.server.emit('user:online', {
        userId: client.userId,
        username: client.username,
      });

      // Send online users list to the connected client
      const onlineUsersList = Array.from(this.onlineUsers.values()).map(
        (user) => ({
          userId: user.userId,
          username: user.username,
        }),
      );
      client.emit('users:online', onlineUsersList);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const onlineUser = this.onlineUsers.get(client.id);

    if (onlineUser) {
      // Remove socket from user's socket set
      const userSocketSet = this.userSockets.get(onlineUser.userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);

        // If user has no more connections, mark as offline
        if (userSocketSet.size === 0) {
          this.userSockets.delete(onlineUser.userId);

          // Notify others that user is offline
          this.server.emit('user:offline', {
            userId: onlineUser.userId,
            username: onlineUser.username,
          });
        }
      }

      this.onlineUsers.delete(client.id);
      this.logger.log(
        `Client disconnected: ${client.id} (User: ${onlineUser.username})`,
      );
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ): Promise<{ event: string; data: MessageResponseDto }> {
    try {
      // Create message in database
      const message = await this.messagesService.create(
        client.userId!,
        createMessageDto,
      );

      // Emit to sender
      client.emit('message:sent', message);

      // Emit to receiver(s)
      if (createMessageDto.receiverId) {
        // Direct message
        this.server
          .to(`user:${createMessageDto.receiverId}`)
          .emit('message:received', message);
      } else if (createMessageDto.conversationId) {
        // Group message
        this.server
          .to(`conversation:${createMessageDto.conversationId}`)
          .emit('message:received', message);
      }

      return { event: 'message:sent', data: message };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      client.emit('message:error', {
        message: 'Failed to send message',
        error: error.message,
      });
      throw error;
    }
  }

  @SubscribeMessage('message:delivered')
  async handleMessageDelivered(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      const message = await this.messagesService.markAsDelivered(data.messageId);

      // Notify sender
      this.server
        .to(`user:${message.senderId}`)
        .emit('message:status', { messageId: message.id, status: 'delivered' });
    } catch (error) {
      this.logger.error(`Error marking message as delivered: ${error.message}`);
    }
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      const message = await this.messagesService.markAsRead(
        data.messageId,
        client.userId!,
      );

      // Notify sender
      this.server
        .to(`user:${message.senderId}`)
        .emit('message:status', { messageId: message.id, status: 'read' });
    } catch (error) {
      this.logger.error(`Error marking message as read: ${error.message}`);
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingData,
  ) {
    const typingData = {
      userId: client.userId,
      username: client.username,
      isTyping: true,
    };

    if (data.receiverId) {
      // Direct message typing
      this.server
        .to(`user:${data.receiverId}`)
        .emit('typing:status', typingData);
    } else if (data.conversationId) {
      // Group chat typing
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('typing:status', typingData);
    }
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingData,
  ) {
    const typingData = {
      userId: client.userId,
      username: client.username,
      isTyping: false,
    };

    if (data.receiverId) {
      // Direct message typing
      this.server
        .to(`user:${data.receiverId}`)
        .emit('typing:status', typingData);
    } else if (data.conversationId) {
      // Group chat typing
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('typing:status', typingData);
    }
  }

  @SubscribeMessage('conversation:join')
  handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
    this.logger.log(
      `User ${client.username} joined conversation ${data.conversationId}`,
    );

    // Notify others in the conversation
    client.to(`conversation:${data.conversationId}`).emit('user:joined', {
      userId: client.userId,
      username: client.username,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    this.logger.log(
      `User ${client.username} left conversation ${data.conversationId}`,
    );

    // Notify others in the conversation
    client.to(`conversation:${data.conversationId}`).emit('user:left', {
      userId: client.userId,
      username: client.username,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  // Helper method to check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Helper method to get online users count
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  // Helper method to emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Helper method to emit to conversation
  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }
}

// Made with Bob
