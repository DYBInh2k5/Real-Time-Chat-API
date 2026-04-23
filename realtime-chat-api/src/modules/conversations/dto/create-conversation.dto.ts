import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
  MaxLength,
  MinLength,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationType } from '../entities/conversation.entity';

export class CreateConversationDto {
  @ApiPropertyOptional({
    description: 'Conversation name (required for groups and channels)',
    example: 'Project Team',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Conversation description',
    example: 'Discussion about the new project',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Conversation type',
    enum: ConversationType,
    example: ConversationType.GROUP,
  })
  @IsEnum(ConversationType)
  type: ConversationType;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @ApiProperty({
    description: 'Array of user IDs to add as members',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  memberIds: string[];

  @ApiPropertyOptional({
    description: 'Is conversation private (invite-only)',
    example: false,
  })
  @IsOptional()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Additional settings',
    example: { allowFileSharing: true, maxMembers: 100 },
  })
  @IsOptional()
  settings?: Record<string, any>;
}

// Made with Bob
