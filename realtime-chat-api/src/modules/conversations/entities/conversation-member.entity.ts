import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Conversation } from './conversation.entity';

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}

@Entity('conversation_members')
@Unique(['conversationId', 'userId'])
@Index(['conversationId', 'userId'])
@Index(['userId', 'joinedAt'])
export class ConversationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: MemberRole,
    default: MemberRole.MEMBER,
  })
  role: MemberRole;

  @Column({ type: 'boolean', default: false })
  isMuted: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastReadAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  lastReadMessageId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  mutedUntil: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any> | null;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  get isOwner(): boolean {
    return this.role === MemberRole.OWNER;
  }

  get isAdmin(): boolean {
    return this.role === MemberRole.ADMIN || this.role === MemberRole.OWNER;
  }

  get isModerator(): boolean {
    return (
      this.role === MemberRole.MODERATOR ||
      this.role === MemberRole.ADMIN ||
      this.role === MemberRole.OWNER
    );
  }

  get canManageMembers(): boolean {
    return this.isAdmin;
  }

  get canDeleteMessages(): boolean {
    return this.isModerator;
  }

  get canEditConversation(): boolean {
    return this.isAdmin;
  }
}

// Made with Bob
