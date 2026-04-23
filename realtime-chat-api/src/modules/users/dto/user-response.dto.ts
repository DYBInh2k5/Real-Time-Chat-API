import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserStatus, UserRole } from '../entities/user.entity';

@Exclude()
export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'john_doe' })
  @Expose()
  username: string;

  @ApiProperty({ example: 'John', required: false })
  @Expose()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @Expose()
  lastName?: string;

  @ApiProperty({ example: 'John Doe' })
  @Expose()
  fullName: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @Expose()
  avatarUrl?: string;

  @ApiProperty({
    example: 'Software developer',
    required: false,
  })
  @Expose()
  bio?: string;

  @ApiProperty({ example: UserStatus.ONLINE, enum: UserStatus })
  @Expose()
  status: UserStatus;

  @ApiProperty({ example: UserRole.USER, enum: UserRole })
  @Expose()
  role: UserRole;

  @ApiProperty({ example: true })
  @Expose()
  isEmailVerified: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  @Expose()
  lastSeenAt?: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}

// Made with Bob
