import { jest } from '@jest/globals';

// ۱. مسدود کردن اتصال واقعی الاستیک‌سرچ در محیط تست واحد برای پایداری و سرعت تست‌ها
jest.unstable_mockModule('../../src/config/elasticsearch.js', () => {
  return {
    default: {
      search: jest.fn(),
      index: jest.fn(),
      indices: {
        exists: jest.fn(),
        create: jest.fn()
      }
    }
  };
});

// ماک کردن دیتابیس
jest.unstable_mockModule('../../src/config/db.js', () => {
  return {
    default: {
      query: jest.fn()
    }
  };
});

const { ElasticsearchService } = await import('../../src/services/elasticsearchService.js');
const { default: esClient } = await import('../../src/config/elasticsearch.js');
const { default: pool } = await import('../../src/config/db.js');

describe('ElasticsearchService Unit Tests (E2E Queries Validation)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('23. Should create index with custom analyzer and tokenizer if it does not exist', async () => {
    esClient.indices.exists.mockResolvedValue(false);
    esClient.indices.create.mockResolvedValue({ acknowledged: true });

    await ElasticsearchService.initIndex();

    expect(esClient.indices.exists).toHaveBeenCalledWith({ index: ElasticsearchService.INDEX_NAME });
    expect(esClient.indices.create).toHaveBeenCalled();
  });

  test('24. Should skip index creation if it already exists', async () => {
    esClient.indices.exists.mockResolvedValue(true);

    await ElasticsearchService.initIndex();

    expect(esClient.indices.exists).toHaveBeenCalledWith({ index: ElasticsearchService.INDEX_NAME });
    expect(esClient.indices.create).not.toHaveBeenCalled();
  });

  test('25. Should compile fuzzy search and map ES hit sources correctly', async () => {
    const mockSearchResult = {
      hits: {
        hits: [
          {
            _source: {
              id: 1,
              home_team: 'Perspolis',
              away_team: 'Esteghlal',
              sport_name: 'Football',
              remaining_capacity: 50,
              status: 'available'
            }
          }
        ]
      }
    };
    esClient.search.mockResolvedValue(mockSearchResult);

    const results = await ElasticsearchService.search({ sport: 'Football', homeTeam: 'Perspolis' });

    expect(esClient.search).toHaveBeenCalled();
    expect(results).toEqual([mockSearchResult.hits.hits[0]._source]);
  });

  test('26. Should format bool_prefix query correctly for Autocomplete', async () => {
    const mockAutocompleteResult = {
      hits: {
        hits: [
          { _source: { home_team: 'Perspolis', away_team: 'Esteghlal' } }
        ]
      }
    };
    esClient.search.mockResolvedValue(mockAutocompleteResult);

    const results = await ElasticsearchService.autocomplete('Per');

    expect(esClient.search).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          query: expect.objectContaining({
            multi_match: expect.objectContaining({
              query: 'Per',
              type: 'bool_prefix'
            })
          })
        })
      })
    );
    expect(results).toEqual([mockAutocompleteResult.hits.hits[0]._source]);
  });
});