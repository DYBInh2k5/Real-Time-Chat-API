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
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a new message' })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.create(userId, createMessageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all messages (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.messagesService.findAll(page, limit);
  }

  @Get('direct/:userId')
  @ApiOperation({ summary: 'Get direct messages with a specific user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Direct messages retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findDirectMessages(
    @CurrentUser('sub') currentUserId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.messagesService.findDirectMessages(
      currentUserId,
      userId,
      page,
      limit,
    );
  }

  @Get('conversation/:conversationId')
  @ApiOperation({ summary: 'Get messages in a conversation (group chat)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Conversation messages retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findConversationMessages(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.messagesService.findConversationMessages(
      conversationId,
      page,
      limit,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search messages by content' })
  @ApiQuery({ name: 'q', required: true, type: String, example: 'hello' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Messages found successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async searchMessages(
    @CurrentUser('sub') userId: string,
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.messagesService.searchMessages(userId, query, page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get message statistics for current user' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(@CurrentUser('sub') userId: string) {
    return this.messagesService.getMessageStats(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@CurrentUser('sub') userId: string) {
    const count = await this.messagesService.getUnreadCount(userId);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific message by ID' })
  @ApiResponse({
    status: 200,
    description: 'Message retrieved successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MessageResponseDto> {
    return this.messagesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a message' })
  @ApiResponse({
    status: 200,
    description: 'Message updated successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your message' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.update(id, userId, updateMessageDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a message (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your message' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.messagesService.remove(id, userId);
    return { message: 'Message deleted successfully' };
  }

  @Patch(':id/delivered')
  @ApiOperation({ summary: 'Mark message as delivered' })
  @ApiResponse({
    status: 200,
    description: 'Message marked as delivered',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsDelivered(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MessageResponseDto> {
    return this.messagesService.markAsDelivered(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({
    status: 200,
    description: 'Message marked as read',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the receiver' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<MessageResponseDto> {
    return this.messagesService.markAsRead(id, userId);
  }

  @Patch('conversation/:conversationId/read')
  @ApiOperation({ summary: 'Mark all messages in conversation as read' })
  @ApiResponse({
    status: 200,
    description: 'Messages marked as read',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markConversationAsRead(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @CurrentUser('sub') userId: string,
  ) {
    const count = await this.messagesService.markConversationAsRead(
      conversationId,
      userId,
    );
    return { message: `${count} messages marked as read` };
  }

  @Patch('direct/:userId/read')
  @ApiOperation({ summary: 'Mark all direct messages from a user as read' })
  @ApiResponse({
    status: 200,
    description: 'Messages marked as read',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markDirectMessagesAsRead(
    @Param('userId', ParseUUIDPipe) senderId: string,
    @CurrentUser('sub') receiverId: string,
  ) {
    const count = await this.messagesService.markDirectMessagesAsRead(
      senderId,
      receiverId,
    );
    return { message: `${count} messages marked as read` };
  }
}

// Made with Bob
