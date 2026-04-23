import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingEmail = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });

    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    data: User[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { username } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // If username is being updated, check if it's already taken
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUsername = await this.findByUsername(updateUserDto.username);
      if (existingUsername) {
        throw new ConflictException('Username already exists');
      }
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findOne(id);
    user.status = status;
    user.lastSeenAt = new Date();
    return await this.userRepository.save(user);
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    const user = await this.findOne(id);
    user.avatarUrl = avatarUrl;
    return await this.userRepository.save(user);
  }

  async search(query: string, page: number = 1, limit: number = 10): Promise<{
    data: User[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query cannot be empty');
    }

    const [data, total] = await this.userRepository.findAndCount({
      where: [
        { username: Like(`%${query}%`) },
        { email: Like(`%${query}%`) },
        { firstName: Like(`%${query}%`) },
        { lastName: Like(`%${query}%`) },
      ],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.userRepository.update(id, { refreshToken });
  }

  async verifyEmail(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    return await this.userRepository.save(user);
  }

  async setPasswordResetToken(
    email: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.userRepository.update(
      { email },
      {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: token },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    return await this.userRepository.save(user);
  }

  async getOnlineUsers(): Promise<User[]> {
    return await this.userRepository.find({
      where: { status: UserStatus.ONLINE },
      order: { lastSeenAt: 'DESC' },
    });
  }

  async getUserStats(id: string): Promise<{
    totalUsers: number;
    onlineUsers: number;
    userCreatedAt: Date;
  }> {
    const user = await this.findOne(id);
    const totalUsers = await this.userRepository.count();
    const onlineUsers = await this.userRepository.count({
      where: { status: UserStatus.ONLINE },
    });

    return {
      totalUsers,
      onlineUsers,
      userCreatedAt: user.createdAt,
    };
  }
}

// Made with Bob
