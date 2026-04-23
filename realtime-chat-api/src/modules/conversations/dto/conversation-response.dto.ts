import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { ConversationType } from '../entities/conversation.entity';
import { MemberRole } from '../entities/conversation-member.entity';

class CreatorInfo {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;
}

class MemberInfo {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  userId: string;

  @ApiProperty({ type: CreatorInfo })
  user: CreatorInfo;

  @ApiProperty({ enum: MemberRole, example: MemberRole.MEMBER })
  role: MemberRole;

  @ApiProperty({ example: false })
  isMuted: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  lastReadAt?: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  joinedAt: Date;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  leftAt?: Date;
}

@Exclude()
export class ConversationResponseDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  @ApiPropertyOptional({ example: 'Project Team' })
  name?: string;

  @Expose()
  @ApiPropertyOptional({ example: 'Discussion about the new project' })
  description?: string;

  @Expose()
  @ApiProperty({ enum: ConversationType, example: ConversationType.GROUP })
  type: ConversationType;

  @Expose()
  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  createdBy: string;

  @Expose()
  @ApiProperty({ type: CreatorInfo })
  @Type(() => CreatorInfo)
  creator: CreatorInfo;

  @Expose()
  @ApiPropertyOptional({ type: [MemberInfo] })
  @Type(() => MemberInfo)
  members?: MemberInfo[];

  @Expose()
  @ApiProperty({ example: false })
  isPrivate: boolean;

  @Expose()
  @ApiProperty({ example: true })
  isActive: boolean;

  @Expose()
  @ApiPropertyOptional({
    example: { allowFileSharing: true, maxMembers: 100 },
  })
  settings?: Record<string, any>;

  @Expose()
  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  lastMessageAt?: Date;

  @Expose()
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174002' })
  lastMessageId?: string;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;

  @Expose()
  @ApiProperty({ example: 5 })
  memberCount: number;

  @Expose()
  @ApiProperty({ example: false })
  isDirect: boolean;

  @Expose()
  @ApiProperty({ example: true })
  isGroup: boolean;

  @Expose()
  @ApiProperty({ example: false })
  isChannel: boolean;
}

@Exclude()
export class ConversationMemberResponseDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  conversationId: string;

  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  userId: string;

  @Expose()
  @ApiProperty({ type: CreatorInfo })
  @Type(() => CreatorInfo)
  user: CreatorInfo;

  @Expose()
  @ApiProperty({ enum: MemberRole, example: MemberRole.MEMBER })
  role: MemberRole;

  @Expose()
  @ApiProperty({ example: false })
  isMuted: boolean;

  @Expose()
  @ApiProperty({ example: true })
  isActive: boolean;

  @Expose()
  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  lastReadAt?: Date;

  @Expose()
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174003' })
  lastReadMessageId?: string;

  @Expose()
  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  mutedUntil?: Date;

  @Expose()
  @ApiPropertyOptional({ example: { notifications: true } })
  settings?: Record<string, any>;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  joinedAt: Date;

  @Expose()
  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  leftAt?: Date;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;

  @Expose()
  @ApiProperty({ example: false })
  isOwner: boolean;

  @Expose()
  @ApiProperty({ example: false })
  isAdmin: boolean;

  @Expose()
  @ApiProperty({ example: false })
  isModerator: boolean;

  @Expose()
  @ApiProperty({ example: false })
  canManageMembers: boolean;

  @Expose()
  @ApiProperty({ example: false })
  canDeleteMessages: boolean;

  @Expose()
  @ApiProperty({ example: false })
  canEditConversation: boolean;
}

// Made with Bob
