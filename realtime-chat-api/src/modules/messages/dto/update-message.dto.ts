import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMessageDto {
  @ApiProperty({
    description: 'Updated message content',
    example: 'Hello, how are you? (edited)',
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { edited: true, editedAt: '2024-01-01T00:00:00Z' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

// Made with Bob
