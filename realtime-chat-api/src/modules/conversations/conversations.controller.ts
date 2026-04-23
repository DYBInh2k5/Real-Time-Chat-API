import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AddMemberDto, AddMembersDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import {
  ConversationResponseDto,
  ConversationMemberResponseDto,
} from './dto/conversation-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createConversationDto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.create(userId, createConversationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all conversations for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser('sub') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.conversationsService.findAllForUser(userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific conversation' })
  @ApiResponse({
    status: 200,
    description: 'Conversation retrieved successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not a member' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a conversation' })
  @ApiResponse({
    status: 200,
    description: 'Conversation updated successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.update(id, userId, updateConversationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a conversation (owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Conversation deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.conversationsService.remove(id, userId);
    return { message: 'Conversation deleted successfully' };
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all members of a conversation' })
  @ApiResponse({
    status: 200,
    description: 'Members retrieved successfully',
    type: [ConversationMemberResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not a member' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<ConversationMemberResponseDto[]> {
    return this.conversationsService.getMembers(id, userId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to conversation' })
  @ApiResponse({
    status: 201,
    description: 'Member added successfully',
    type: ConversationMemberResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Body() addMemberDto: AddMemberDto,
  ): Promise<ConversationMemberResponseDto> {
    return this.conversationsService.addMember(id, userId, addMemberDto);
  }

  @Post(':id/members/bulk')
  @ApiOperation({ summary: 'Add multiple members to conversation' })
  @ApiResponse({
    status: 201,
    description: 'Members added successfully',
    type: [ConversationMemberResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Body() addMembersDto: AddMembersDto,
  ): Promise<ConversationMemberResponseDto[]> {
    return this.conversationsService.addMembers(id, userId, addMembersDto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from conversation' })
  @ApiResponse({
    status: 200,
    description: 'Member removed successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Param('userId', ParseUUIDPipe) memberUserId: string,
  ) {
    await this.conversationsService.removeMember(id, userId, memberUserId);
    return { message: 'Member removed successfully' };
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a conversation' })
  @ApiResponse({
    status: 200,
    description: 'Left conversation successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Owner cannot leave' })
  @ApiResponse({ status: 404, description: 'Not a member' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async leaveConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.conversationsService.leaveConversation(id, userId);
    return { message: 'Left conversation successfully' };
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Update member role or settings' })
  @ApiResponse({
    status: 200,
    description: 'Member updated successfully',
    type: ConversationMemberResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMember(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Param('userId', ParseUUIDPipe) memberUserId: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ): Promise<ConversationMemberResponseDto> {
    return this.conversationsService.updateMember(
      id,
      userId,
      memberUserId,
      updateMemberDto,
    );
  }
}

// Made with Bob
