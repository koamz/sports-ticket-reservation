import crypto from 'crypto';
import redisClient from '../config/redis.js';
import { TicketRepository } from '../repositories/ticketRepository.js';
import { ElasticsearchService } from './elasticsearchService.js'; // اضافه کردن سرویس الاستیک

export class TicketService {
  static async search(filters) {
    const filterHash = crypto.createHash('md5').update(JSON.stringify(filters)).digest('hex');
    const cacheKey = `tickets:search:${filterHash}`;

    // ۱. بررسی کش لایه اول (Redis Cache)
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log('Search results fetched from Redis Cache.');
      return JSON.parse(cachedData);
    }

    // ۲. در صورت بروز Cache Miss، کوئری مستقیم به لایه الاستیک‌سرچ زده می‌شود (نه دیسک SQL)
    console.log('Cache Miss. Querying Elasticsearch Server...');
    const results = await ElasticsearchService.search(filters);
    
    // ذخیره در ردیس کش با TTL مشخص
    await redisClient.setEx(cacheKey, 60, JSON.stringify(results));
    return results;
  }

  static async getDetails(ticketId) {
    const cacheKey = `ticket:details:${ticketId}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const ticket = await TicketRepository.findDetailById(ticketId);
    if (ticket) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(ticket));
    }
    return ticket;
  }

  static async clearTicketCache(ticketId) {
    await redisClient.del(`ticket:details:${ticketId}`);
    const keys = await redisClient.keys('tickets:search:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }
}