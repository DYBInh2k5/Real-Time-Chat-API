import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MemberRole } from '../entities/conversation-member.entity';

export class UpdateMemberDto {
  @ApiPropertyOptional({
    description: 'Member role',
    enum: MemberRole,
  })
  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;

  @ApiPropertyOptional({
    description: 'Is member muted',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isMuted?: boolean;

  @ApiPropertyOptional({
    description: 'Additional settings',
    example: { notifications: true },
  })
  @IsOptional()
  settings?: Record<string, any>;
}

// Made with Bob
