import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * Set value in cache with TTL (in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  /**
   * Get or set pattern: Get from cache, if not exists, execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Generate cache key for user
   */
  getUserKey(userId: string): string {
    return `user:${userId}`;
  }

  /**
   * Generate cache key for conversation
   */
  getConversationKey(conversationId: string): string {
    return `conversation:${conversationId}`;
  }

  /**
   * Generate cache key for messages
   */
  getMessagesKey(conversationId: string, page: number): string {
    return `messages:${conversationId}:page:${page}`;
  }

  /**
   * Generate cache key for online users
   */
  getOnlineUsersKey(): string {
    return 'users:online';
  }

  /**
   * Invalidate user cache
   */
  async invalidateUser(userId: string): Promise<void> {
    await this.del(this.getUserKey(userId));
  }

  /**
   * Invalidate conversation cache
   */
  async invalidateConversation(conversationId: string): Promise<void> {
    await this.del(this.getConversationKey(conversationId));
  }

  /**
   * Invalidate messages cache for a conversation
   */
  async invalidateMessages(conversationId: string): Promise<void> {
    // In a real implementation, you'd want to delete all pages
    // This is a simplified version
    for (let page = 1; page <= 10; page++) {
      await this.del(this.getMessagesKey(conversationId, page));
    }
  }
}

// Made with Bob
