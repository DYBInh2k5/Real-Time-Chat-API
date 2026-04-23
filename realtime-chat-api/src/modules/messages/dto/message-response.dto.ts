import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { MessageType, MessageStatus } from '../entities/message.entity';

class SenderInfo {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;
}

class ReceiverInfo {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  id: string;

  @ApiProperty({ example: 'jane_doe' })
  username: string;

  @ApiProperty({ example: 'Jane Doe' })
  fullName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;
}

class ReplyToInfo {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  id: string;

  @ApiProperty({ example: 'Original message content' })
  content: string;

  @ApiProperty({ type: SenderInfo })
  sender: SenderInfo;
}

@Exclude()
export class MessageResponseDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174003' })
  id: string;

  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  senderId: string;

  @Expose()
  @ApiProperty({ type: SenderInfo })
  @Type(() => SenderInfo)
  sender: SenderInfo;

  @Expose()
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001' })
  receiverId?: string;

  @Expose()
  @ApiPropertyOptional({ type: ReceiverInfo })
  @Type(() => ReceiverInfo)
  receiver?: ReceiverInfo;

  @Expose()
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174004' })
  conversationId?: string;

  @Expose()
  @ApiProperty({ example: 'Hello, how are you?' })
  content: string;

  @Expose()
  @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
  type: MessageType;

  @Expose()
  @ApiProperty({ enum: MessageStatus, example: MessageStatus.SENT })
  status: MessageStatus;

  @Expose()
  @ApiPropertyOptional({
    example: { fileName: 'document.pdf', fileSize: 1024000 },
  })
  metadata?: Record<string, any>;

  @Expose()
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174002' })
  replyToId?: string;

  @Expose()
  @ApiPropertyOptional({ type: ReplyToInfo })
  @Type(() => ReplyToInfo)
  replyTo?: ReplyToInfo;

  @Expose()
  @ApiProperty({ example: false })
  isEdited: boolean;

  @Expose()
  @ApiProperty({ example: false })
  isDeleted: boolean;

  @Expose()
  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  deletedAt?: Date;

  @Expose()
  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  readAt?: Date;

  @Expose()
  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  deliveredAt?: Date;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;

  @Expose()
  @ApiProperty({ example: false })
  isRead: boolean;

  @Expose()
  @ApiProperty({ example: false })
  isDelivered: boolean;
}

// Made with Bob
