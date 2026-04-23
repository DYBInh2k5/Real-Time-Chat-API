import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ConversationMember } from './conversation-member.entity';
import { Message } from '../../messages/entities/message.entity';

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  CHANNEL = 'channel',
}

@Entity('conversations')
@Index(['type', 'createdAt'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.GROUP,
  })
  type: ConversationType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar: string | null;

  @Column({ type: 'uuid' })
  @Index()
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => ConversationMember, (member) => member.conversation, {
    cascade: true,
  })
  members: ConversationMember[];

  @OneToMany(() => Message, (message) => message.conversationId)
  messages: Message[];

  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any> | null;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  lastMessageId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to get member count
  get memberCount(): number {
    return this.members?.length || 0;
  }

  // Helper method to check if conversation is direct message
  get isDirect(): boolean {
    return this.type === ConversationType.DIRECT;
  }

  // Helper method to check if conversation is group
  get isGroup(): boolean {
    return this.type === ConversationType.GROUP;
  }

  // Helper method to check if conversation is channel
  get isChannel(): boolean {
    return this.type === ConversationType.CHANNEL;
  }
}

// Made with Bob
