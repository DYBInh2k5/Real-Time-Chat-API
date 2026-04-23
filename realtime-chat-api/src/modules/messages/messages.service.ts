import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { Message, MessageStatus, MessageType } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  /**
   * Create a new message
   */
  async create(
    senderId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    // Validate that either receiverId or conversationId is provided
    if (!createMessageDto.receiverId && !createMessageDto.conversationId) {
      throw new BadRequestException(
        'Either receiverId or conversationId must be provided',
      );
    }

    // Create message
    const message = this.messageRepository.create({
      ...createMessageDto,
      senderId,
      status: MessageStatus.SENT,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Load relations
    const messageWithRelations = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'receiver', 'replyTo', 'replyTo.sender'],
    });

    return this.toResponseDto(messageWithRelations!);
  }

  /**
   * Find all messages with pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: MessageResponseDto[]; total: number; page: number; limit: number }> {
    const [messages, total] = await this.messageRepository.findAndCount({
      relations: ['sender', 'receiver', 'replyTo', 'replyTo.sender'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      where: { isDeleted: false },
    });

    return {
      data: messages.map((msg) => this.toResponseDto(msg)),
      total,
      page,
      limit,
    };
  }

  /**
   * Find messages between two users (direct messages)
   */
  async findDirectMessages(
    userId1: string,
    userId2: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: MessageResponseDto[]; total: number; page: number; limit: number }> {
    const [messages, total] = await this.messageRepository.findAndCount({
      where: [
        { senderId: userId1, receiverId: userId2, isDeleted: false },
        { senderId: userId2, receiverId: userId1, isDeleted: false },
      ],
      relations: ['sender', 'receiver', 'replyTo', 'replyTo.sender'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: messages.map((msg) => this.toResponseDto(msg)),
      total,
      page,
      limit,
    };
  }

  /**
   * Find messages in a conversation (group chat)
   */
  async findConversationMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: MessageResponseDto[]; total: number; page: number; limit: number }> {
    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversationId, isDeleted: false },
      relations: ['sender', 'receiver', 'replyTo', 'replyTo.sender'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: messages.map((msg) => this.toResponseDto(msg)),
      total,
      page,
      limit,
    };
  }

  /**
   * Find one message by ID
   */
  async findOne(id: string): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver', 'replyTo', 'replyTo.sender'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return this.toResponseDto(message);
  }

  /**
   * Update a message (edit)
   */
  async update(
    id: string,
    userId: string,
    updateMessageDto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver', 'replyTo', 'replyTo.sender'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Check if user is the sender
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    // Check if message is already deleted
    if (message.isDeleted) {
      throw new BadRequestException('Cannot edit a deleted message');
    }

    // Update message
    message.content = updateMessageDto.content;
    message.isEdited = true;
    if (updateMessageDto.metadata) {
      message.metadata = {
        ...message.metadata,
        ...updateMessageDto.metadata,
      };
    }

    const updatedMessage = await this.messageRepository.save(message);

    return this.toResponseDto(updatedMessage);
  }

  /**
   * Soft delete a message
   */
  async remove(id: string, userId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Check if user is the sender
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'This message has been deleted';

    await this.messageRepository.save(message);
  }

  /**
   * Mark message as delivered
   */
  async markAsDelivered(id: string): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver', 'replyTo', 'replyTo.sender'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    if (message.status === MessageStatus.SENT) {
      message.status = MessageStatus.DELIVERED;
      message.deliveredAt = new Date();
      await this.messageRepository.save(message);
    }

    return this.toResponseDto(message);
  }

  /**
   * Mark message as read
   */
  async markAsRead(id: string, userId: string): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver', 'replyTo', 'replyTo.sender'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Only receiver can mark as read
    if (message.receiverId !== userId) {
      throw new ForbiddenException('Only the receiver can mark message as read');
    }

    if (message.status !== MessageStatus.READ) {
      message.status = MessageStatus.READ;
      message.readAt = new Date();
      if (!message.deliveredAt) {
        message.deliveredAt = new Date();
      }
      await this.messageRepository.save(message);
    }

    return this.toResponseDto(message);
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    const result = await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({
        status: MessageStatus.READ,
        readAt: new Date(),
      })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('receiverId = :userId', { userId })
      .andWhere('status != :status', { status: MessageStatus.READ })
      .execute();

    return result.affected || 0;
  }

  /**
   * Mark all direct messages as read
   */
  async markDirectMessagesAsRead(
    senderId: string,
    receiverId: string,
  ): Promise<number> {
    const result = await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({
        status: MessageStatus.READ,
        readAt: new Date(),
      })
      .where('senderId = :senderId', { senderId })
      .andWhere('receiverId = :receiverId', { receiverId })
      .andWhere('status != :status', { status: MessageStatus.READ })
      .execute();

    return result.affected || 0;
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepository.count({
      where: {
        receiverId: userId,
        status: MessageStatus.SENT,
        isDeleted: false,
      },
    });
  }

  /**
   * Search messages by content
   */
  async searchMessages(
    userId: string,
    query: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: MessageResponseDto[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .leftJoinAndSelect('message.replyTo', 'replyTo')
      .leftJoinAndSelect('replyTo.sender', 'replyToSender')
      .where('message.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere(
        '(message.senderId = :userId OR message.receiverId = :userId)',
        { userId },
      )
      .andWhere('message.content ILIKE :query', { query: `%${query}%` })
      .orderBy('message.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [messages, total] = await queryBuilder.getManyAndCount();

    return {
      data: messages.map((msg) => this.toResponseDto(msg)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get message statistics for a user
   */
  async getMessageStats(userId: string): Promise<{
    totalSent: number;
    totalReceived: number;
    unreadCount: number;
  }> {
    const [totalSent, totalReceived, unreadCount] = await Promise.all([
      this.messageRepository.count({
        where: { senderId: userId, isDeleted: false },
      }),
      this.messageRepository.count({
        where: { receiverId: userId, isDeleted: false },
      }),
      this.getUnreadCount(userId),
    ]);

    return {
      totalSent,
      totalReceived,
      unreadCount,
    };
  }

  /**
   * Convert message entity to response DTO
   */
  private toResponseDto(message: Message): MessageResponseDto {
    return plainToInstance(MessageResponseDto, message, {
      excludeExtraneousValues: true,
    });
  }
}

// Made with Bob
