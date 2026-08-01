import { jest } from '@jest/globals';

// ۱. ماک کردن ردیس
jest.unstable_mockModule('../../src/config/redis.js', () => {
  return {
    default: {
      get: jest.fn(),
      setEx: jest.fn(),
      keys: jest.fn(),
      del: jest.fn()
    }
  };
});

// ۲. مسدود کردن اتصال واقعی الاستیک‌سرچ در تست واحد
jest.unstable_mockModule('../../src/config/elasticsearch.js', () => {
  return {
    default: {
      search: jest.fn()
    }
  };
});

// ۳. ماک کردن منطق سرویس الاستیک‌سرچ
jest.unstable_mockModule('../../src/services/elasticsearchService.js', () => {
  return {
    ElasticsearchService: {
      search: jest.fn()
    }
  };
});

// ۴. ماک کردن ریپازیتوری بلیط دیتابیس
jest.unstable_mockModule('../../src/repositories/ticketRepository.js', () => {
  return {
    TicketRepository: {
      findDetailById: jest.fn()
    }
  };
});

// ۵. ایمپورت پویای ماژول‌ها پس از شبیه‌سازی کامل ماک‌ها
const { TicketService } = await import('../../src/services/ticketService.js');
const { default: redisClient } = await import('../../src/config/redis.js');
const { ElasticsearchService } = await import('../../src/services/elasticsearchService.js');
const { TicketRepository } = await import('../../src/repositories/ticketRepository.js');

describe('TicketService Unit Tests (Synced with Elasticsearch)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('1. Should return cached search results if available in Redis', async () => {
    const mockFilters = { sport: 'Football' };
    const mockCacheData = JSON.stringify([{ ticket_id: 1, price: 150000 }]);
    redisClient.get.mockResolvedValue(mockCacheData);

    const result = await TicketService.search(mockFilters);

    expect(redisClient.get).toHaveBeenCalled();
    expect(ElasticsearchService.search).not.toHaveBeenCalled();
    expect(result).toEqual([{ ticket_id: 1, price: 150000 }]);
  });

  test('2. Should query Elasticsearch and save cache in Redis if cache misses', async () => {
    const mockFilters = { sport: 'Football' };
    const mockDbData = [{ ticket_id: 1, price: 150000 }];
    
    redisClient.get.mockResolvedValue(null);
    ElasticsearchService.search.mockResolvedValue(mockDbData); // تغییر از ریپازیتوری دیتابیس به الاستیک‌سرچ
    redisClient.setEx.mockResolvedValue('OK');

    const result = await TicketService.search(mockFilters);

    expect(redisClient.get).toHaveBeenCalled();
    expect(ElasticsearchService.search).toHaveBeenCalledWith(mockFilters); // بررسی صدا زدن لایه الاستیک
    expect(redisClient.setEx).toHaveBeenCalled();
    expect(result).toEqual(mockDbData);
  });

  test('3. Should return cached ticket details if available', async () => {
    const ticketId = 1;
    const mockTicket = { id: 1, price: 150000, sport_name: 'Football' };
    redisClient.get.mockResolvedValue(JSON.stringify(mockTicket));

    const result = await TicketService.getDetails(ticketId);

    expect(redisClient.get).toHaveBeenCalledWith(`ticket:details:${ticketId}`);
    expect(TicketRepository.findDetailById).not.toHaveBeenCalled();
    expect(result).toEqual(mockTicket);
  });

  test('4. Should query database and cache details if not in Redis', async () => {
    const ticketId = 1;
    const mockTicket = { id: 1, price: 150000, sport_name: 'Football' };
    
    redisClient.get.mockResolvedValue(null);
    TicketRepository.findDetailById.mockResolvedValue(mockTicket);
    redisClient.setEx.mockResolvedValue('OK');

    const result = await TicketService.getDetails(ticketId);

    expect(redisClient.get).toHaveBeenCalledWith(`ticket:details:${ticketId}`);
    expect(TicketRepository.findDetailById).toHaveBeenCalledWith(ticketId);
    expect(redisClient.setEx).toHaveBeenCalled();
    expect(result).toEqual(mockTicket);
  });

  test('5. Should clear correct keys on ticket cache invalidation', async () => {
    const ticketId = 1;
    redisClient.keys.mockResolvedValue(['tickets:search:abc', 'tickets:search:xyz']);
    redisClient.del.mockResolvedValue('OK');

    await TicketService.clearTicketCache(ticketId);

    expect(redisClient.del).toHaveBeenCalledWith(`ticket:details:${ticketId}`);
    expect(redisClient.keys).toHaveBeenCalledWith('tickets:search:*');
    expect(redisClient.del).toHaveBeenCalledWith(['tickets:search:abc', 'tickets:search:xyz']);
  });
});