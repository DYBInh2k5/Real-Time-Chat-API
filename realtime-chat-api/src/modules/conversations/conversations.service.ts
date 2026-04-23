import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Conversation, ConversationType } from './entities/conversation.entity';
import { ConversationMember, MemberRole } from './entities/conversation-member.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AddMemberDto, AddMembersDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import {
  ConversationResponseDto,
  ConversationMemberResponseDto,
} from './dto/conversation-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationMember)
    private readonly memberRepository: Repository<ConversationMember>,
  ) {}

  /**
   * Create a new conversation
   */
  async create(
    userId: string,
    createConversationDto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    const { memberIds, type, ...conversationData } = createConversationDto;

    // Validate conversation type requirements
    if (type === ConversationType.DIRECT && memberIds.length !== 1) {
      throw new BadRequestException(
        'Direct conversations must have exactly one other member',
      );
    }

    if (
      (type === ConversationType.GROUP || type === ConversationType.CHANNEL) &&
      !conversationData.name
    ) {
      throw new BadRequestException(
        'Group and channel conversations must have a name',
      );
    }

    // Check if direct conversation already exists
    if (type === ConversationType.DIRECT) {
      const existingConversation = await this.findDirectConversation(
        userId,
        memberIds[0],
      );
      if (existingConversation) {
        return this.toResponseDto(existingConversation);
      }
    }

    // Create conversation
    const conversation = this.conversationRepository.create({
      ...conversationData,
      type,
      createdBy: userId,
    });

    const savedConversation = await this.conversationRepository.save(conversation);

    // Add creator as owner
    await this.memberRepository.save({
      conversationId: savedConversation.id,
      userId,
      role: MemberRole.OWNER,
      isActive: true,
    });

    // Add other members
    if (memberIds.length > 0) {
      const members = memberIds.map((memberId) =>
        this.memberRepository.create({
          conversationId: savedConversation.id,
          userId: memberId,
          role: MemberRole.MEMBER,
          isActive: true,
        }),
      );
      await this.memberRepository.save(members);
    }

    // Load with relations
    const conversationWithRelations = await this.conversationRepository.findOne({
      where: { id: savedConversation.id },
      relations: ['creator', 'members', 'members.user'],
    });

    return this.toResponseDto(conversationWithRelations!);
  }

  /**
   * Find all conversations for a user
   */
  async findAllForUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: ConversationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.creator', 'creator')
      .leftJoinAndSelect('conversation.members', 'members')
      .leftJoinAndSelect('members.user', 'user')
      .where('members.userId = :userId', { userId })
      .andWhere('members.isActive = :isActive', { isActive: true })
      .andWhere('conversation.isActive = :isActive', { isActive: true })
      .orderBy('conversation.lastMessageAt', 'DESC', 'NULLS LAST')
      .addOrderBy('conversation.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [conversations, total] = await queryBuilder.getManyAndCount();

    return {
      data: conversations.map((conv) => this.toResponseDto(conv)),
      total,
      page,
      limit,
    };
  }

  /**
   * Find one conversation by ID
   */
  async findOne(id: string, userId?: string): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['creator', 'members', 'members.user'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // Check if user is a member (if userId provided)
    if (userId) {
      const isMember = conversation.members.some(
        (member) => member.userId === userId && member.isActive,
      );
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this conversation');
      }
    }

    return this.toResponseDto(conversation);
  }

  /**
   * Update conversation
   */
  async update(
    id: string,
    userId: string,
    updateConversationDto: UpdateConversationDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['creator', 'members', 'members.user'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // Check if user has permission to edit
    const member = conversation.members.find((m) => m.userId === userId);
    if (!member || !member.canEditConversation) {
      throw new ForbiddenException(
        'You do not have permission to edit this conversation',
      );
    }

    // Update conversation
    Object.assign(conversation, updateConversationDto);
    const updatedConversation = await this.conversationRepository.save(conversation);

    return this.toResponseDto(updatedConversation);
  }

  /**
   * Delete conversation (soft delete)
   */
  async remove(id: string, userId: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['members'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // Only owner can delete
    const member = conversation.members.find((m) => m.userId === userId);
    if (!member || !member.isOwner) {
      throw new ForbiddenException(
        'Only the owner can delete this conversation',
      );
    }

    conversation.isActive = false;
    await this.conversationRepository.save(conversation);
  }

  /**
   * Add a member to conversation
   */
  async addMember(
    conversationId: string,
    userId: string,
    addMemberDto: AddMemberDto,
  ): Promise<ConversationMemberResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['members'],
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    // Check if requester has permission
    const requester = conversation.members.find((m) => m.userId === userId);
    if (!requester || !requester.canManageMembers) {
      throw new ForbiddenException(
        'You do not have permission to add members',
      );
    }

    // Check if user is already a member
    const existingMember = await this.memberRepository.findOne({
      where: {
        conversationId,
        userId: addMemberDto.userId,
      },
    });

    if (existingMember) {
      if (existingMember.isActive) {
        throw new ConflictException('User is already a member');
      }
      // Reactivate member
      existingMember.isActive = true;
      existingMember.leftAt = null;
      const reactivatedMember = await this.memberRepository.save(existingMember);
      return this.toMemberResponseDto(reactivatedMember);
    }

    // Add new member
    const member = this.memberRepository.create({
      conversationId,
      userId: addMemberDto.userId,
      role: addMemberDto.role || MemberRole.MEMBER,
      isActive: true,
    });

    const savedMember = await this.memberRepository.save(member);

    // Load with relations
    const memberWithRelations = await this.memberRepository.findOne({
      where: { id: savedMember.id },
      relations: ['user'],
    });

    return this.toMemberResponseDto(memberWithRelations!);
  }

  /**
   * Add multiple members to conversation
   */
  async addMembers(
    conversationId: string,
    userId: string,
    addMembersDto: AddMembersDto,
  ): Promise<ConversationMemberResponseDto[]> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['members'],
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    // Check permission
    const requester = conversation.members.find((m) => m.userId === userId);
    if (!requester || !requester.canManageMembers) {
      throw new ForbiddenException(
        'You do not have permission to add members',
      );
    }

    const addedMembers: ConversationMemberResponseDto[] = [];

    for (const memberId of addMembersDto.userIds) {
      try {
        const member = await this.addMember(conversationId, userId, {
          userId: memberId,
          role: addMembersDto.role,
        });
        addedMembers.push(member);
      } catch (error) {
        // Skip if already member
        if (error instanceof ConflictException) {
          continue;
        }
        throw error;
      }
    }

    return addedMembers;
  }

  /**
   * Remove a member from conversation
   */
  async removeMember(
    conversationId: string,
    userId: string,
    memberUserId: string,
  ): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['members'],
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    // Check permission
    const requester = conversation.members.find((m) => m.userId === userId);
    if (!requester || !requester.canManageMembers) {
      throw new ForbiddenException(
        'You do not have permission to remove members',
      );
    }

    const member = await this.memberRepository.findOne({
      where: {
        conversationId,
        userId: memberUserId,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Cannot remove owner
    if (member.isOwner) {
      throw new ForbiddenException('Cannot remove the owner');
    }

    member.isActive = false;
    member.leftAt = new Date();
    await this.memberRepository.save(member);
  }

  /**
   * Leave conversation
   */
  async leaveConversation(conversationId: string, userId: string): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: {
        conversationId,
        userId,
      },
      relations: ['conversation', 'conversation.members'],
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this conversation');
    }

    // Owner cannot leave, must transfer ownership first
    if (member.isOwner) {
      throw new BadRequestException(
        'Owner cannot leave. Transfer ownership first',
      );
    }

    member.isActive = false;
    member.leftAt = new Date();
    await this.memberRepository.save(member);
  }

  /**
   * Update member role/settings
   */
  async updateMember(
    conversationId: string,
    userId: string,
    memberUserId: string,
    updateMemberDto: UpdateMemberDto,
  ): Promise<ConversationMemberResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['members'],
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    // Check permission
    const requester = conversation.members.find((m) => m.userId === userId);
    if (!requester || !requester.canManageMembers) {
      throw new ForbiddenException(
        'You do not have permission to update members',
      );
    }

    const member = await this.memberRepository.findOne({
      where: {
        conversationId,
        userId: memberUserId,
      },
      relations: ['user'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Cannot change owner role
    if (member.isOwner && updateMemberDto.role) {
      throw new ForbiddenException('Cannot change owner role');
    }

    Object.assign(member, updateMemberDto);
    const updatedMember = await this.memberRepository.save(member);

    return this.toMemberResponseDto(updatedMember);
  }

  /**
   * Get conversation members
   */
  async getMembers(
    conversationId: string,
    userId: string,
  ): Promise<ConversationMemberResponseDto[]> {
    // Check if user is a member
    const userMember = await this.memberRepository.findOne({
      where: {
        conversationId,
        userId,
        isActive: true,
      },
    });

    if (!userMember) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    const members = await this.memberRepository.find({
      where: {
        conversationId,
        isActive: true,
      },
      relations: ['user'],
      order: {
        role: 'ASC',
        joinedAt: 'ASC',
      },
    });

    return members.map((member) => this.toMemberResponseDto(member));
  }

  /**
   * Find direct conversation between two users
   */
  private async findDirectConversation(
    userId1: string,
    userId2: string,
  ): Promise<Conversation | null> {
    const conversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.members', 'members')
      .leftJoinAndSelect('conversation.creator', 'creator')
      .leftJoinAndSelect('members.user', 'user')
      .where('conversation.type = :type', { type: ConversationType.DIRECT })
      .andWhere('conversation.isActive = :isActive', { isActive: true })
      .andWhere(
        (qb) => {
          const subQuery = qb
            .subQuery()
            .select('m.conversationId')
            .from(ConversationMember, 'm')
            .where('m.userId IN (:...userIds)', { userIds: [userId1, userId2] })
            .andWhere('m.isActive = :isActive', { isActive: true })
            .groupBy('m.conversationId')
            .having('COUNT(DISTINCT m.userId) = 2')
            .getQuery();
          return 'conversation.id IN ' + subQuery;
        },
      )
      .getOne();

    return conversation;
  }

  /**
   * Convert conversation entity to response DTO
   */
  private toResponseDto(conversation: Conversation): ConversationResponseDto {
    return plainToInstance(ConversationResponseDto, conversation, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Convert member entity to response DTO
   */
  private toMemberResponseDto(
    member: ConversationMember,
  ): ConversationMemberResponseDto {
    return plainToInstance(ConversationMemberResponseDto, member, {
      excludeExtraneousValues: true,
    });
  }
}

// Made with Bob
