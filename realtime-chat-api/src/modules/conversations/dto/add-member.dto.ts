import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberRole } from '../entities/conversation-member.entity';

export class AddMemberDto {
  @ApiProperty({
    description: 'User ID to add',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    description: 'Member role',
    enum: MemberRole,
    default: MemberRole.MEMBER,
  })
  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;
}

export class AddMembersDto {
  @ApiProperty({
    description: 'Array of user IDs to add',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsUUID('4', { each: true })
  userIds: string[];

  @ApiPropertyOptional({
    description: 'Default role for all members',
    enum: MemberRole,
    default: MemberRole.MEMBER,
  })
  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;
}

// Made with Bob
