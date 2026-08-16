import esClient from '../config/elasticsearch.js';
import pool from '../config/db.js';

export class ElasticsearchService {
  static INDEX_NAME = 'tickets_index';

  // ۱. ایجاد ایندکس و تنظیم مپینگ فیلدهای چندزبانه انگلیسی و فارسی برای Autocomplete
  static async initIndex() {
    try {
      const exists = await esClient.indices.exists({ index: this.INDEX_NAME });
      if (exists) {
        console.log(`Elasticsearch index "${this.INDEX_NAME}" already exists.`);
        return;
      }

      await esClient.indices.create({
        index: this.INDEX_NAME,
        body: {
          settings: {
            analysis: {
              analyzer: {
                persian_autocomplete: {
                  tokenizer: 'autocomplete_tokenizer',
                  filter: ['lowercase', 'persian_normalization']
                }
              },
              tokenizer: {
                autocomplete_tokenizer: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 15,
                  token_chars: ['letter', 'digit']
                }
              }
            }
          },
          mappings: {
            properties: {
              id: { type: 'integer' },
              price: { type: 'double' },
              remaining_capacity: { type: 'integer' },
              status: { type: 'keyword' },
              category_name_en: { type: 'keyword' },
              category_name_fa: { type: 'keyword' },
              sport_name_en: { type: 'keyword' },
              sport_name_fa: { type: 'keyword' },
              match_time: { type: 'date' },
              home_team_en: { 
                type: 'text', 
                fields: { autocomplete: { type: 'text', analyzer: 'persian_autocomplete' } }
              },
              home_team_fa: { 
                type: 'text', 
                fields: { autocomplete: { type: 'text', analyzer: 'persian_autocomplete' } }
              },
              away_team_en: { 
                type: 'text', 
                fields: { autocomplete: { type: 'text', analyzer: 'persian_autocomplete' } }
              },
              away_team_fa: { 
                type: 'text', 
                fields: { autocomplete: { type: 'text', analyzer: 'persian_autocomplete' } }
              },
              venue_name_en: { 
                type: 'text', 
                fields: { autocomplete: { type: 'text', analyzer: 'persian_autocomplete' } }
              },
              venue_name_fa: { 
                type: 'text', 
                fields: { autocomplete: { type: 'text', analyzer: 'persian_autocomplete' } }
              },
              city_name_en: { type: 'keyword' },
              city_name_fa: { type: 'keyword' }
            }
          }
        }
      });
      console.log(`Elasticsearch index "${this.INDEX_NAME}" created with mappings.`);
    } catch (e) {
      console.error('Error creating Elasticsearch index:', e.message);
    }
  }

  // ۲. همگام‌سازی لحظه‌ای (Real-time Sync) تک‌بلیط چندزبانه از PostgreSQL به Elasticsearch
  static async syncTicket(ticketId) {
    try {
      const query = `
        SELECT t.id, t.price, t.remaining_capacity, t.status,
               tc.name_en AS category_name_en, tc.name_fa AS category_name_fa,
               s.name_en AS sport_name_en, s.name_fa AS sport_name_fa,
               m.match_time, h.name_en AS home_team_en, h.name_fa AS home_team_fa,
               a.name_en AS away_team_en, a.name_fa AS away_team_fa,
               v.name_en AS venue_name_en, v.name_fa AS venue_name_fa,
               c.name_en AS city_name_en, c.name_fa AS city_name_fa
        FROM tickets t
        JOIN ticket_categories tc ON t.category_id = tc.id
        JOIN matches m ON t.match_id = m.id
        JOIN sports s ON m.sport_id = s.id
        JOIN teams h ON m.home_team_id = h.id
        JOIN teams a ON m.away_team_id = a.id
        JOIN venues v ON m.venue_id = v.id
        JOIN cities c ON v.city_id = c.id
        WHERE t.id = $1
      `;
      const { rows } = await pool.query(query, [ticketId]);
      if (rows.length === 0) {
        await esClient.delete({ index: this.INDEX_NAME, id: ticketId.toString() }, { ignore: [404] });
        return;
      }

      const ticket = rows[0];
      await esClient.index({
        index: this.INDEX_NAME,
        id: ticket.id.toString(),
        document: {
          id: ticket.id,
          price: parseFloat(ticket.price),
          remaining_capacity: ticket.remaining_capacity,
          status: ticket.status,
          category_name_en: ticket.category_name_en,
          category_name_fa: ticket.category_name_fa,
          sport_name_en: ticket.sport_name_en,
          sport_name_fa: ticket.sport_name_fa,
          match_time: ticket.match_time,
          home_team_en: ticket.home_team_en,
          home_team_fa: ticket.home_team_fa,
          away_team_en: ticket.away_team_en,
          away_team_fa: ticket.away_team_fa,
          venue_name_en: ticket.venue_name_en,
          venue_name_fa: ticket.venue_name_fa,
          city_name_en: ticket.city_name_en,
          city_name_fa: ticket.city_name_fa
        }
      });
    } catch (e) {
      console.error(`Failed to sync ticket ID ${ticketId} to ES:`, e.message);
    }
  }

  // ۳. همگام‌سازی سرد سراسری (Cold Sync) هنگام بالا آمدن پروژه
  static async syncAllTickets() {
    try {
      const query = `SELECT id FROM tickets`;
      const { rows } = await pool.query(query);
      for (const row of rows) {
        await this.syncTicket(row.id);
      }
      console.log(`[ES COLD SYNC] Fully synchronized ${rows.length} tickets to Elasticsearch.`);
    } catch (e) {
      console.error('Error during global ES sync:', e.message);
    }
  }

  // ۴. موتور جستجوی هوشمند الاستیک‌سرچ با پشتیبانی همزمان از عبارات فارسی و انگلیسی
  static async search({ sport, homeTeam, awayTeam, city, venue, tier, maxPrice }) {
    try {
      const mustQueries = [
        { term: { status: 'available' } },
        { range: { remaining_capacity: { gt: 0 } } }
      ];

      // فیلتر هوشمند نوع ورزش (پشتیبانی همزمان از فارسی و انگلیسی بدون حساسیت به حروف)
      if (sport) {
        mustQueries.push({
          multi_match: {
            query: sport,
            fields: ['sport_name_en', 'sport_name_fa']
          }
        });
      }

      // فیلتر هوشمند شهر برگزاری (پشتیبانی همزمان از فارسی و انگلیسی)
      if (city) {
        mustQueries.push({
          multi_match: {
            query: city,
            fields: ['city_name_en', 'city_name_fa']
          }
        });
      }

      // فیلتر رده بلیط
      if (tier) {
        mustQueries.push({
          multi_match: {
            query: tier,
            fields: ['category_name_en', 'category_name_fa']
          }
        });
      }
      
      if (homeTeam) {
        mustQueries.push({
          multi_match: {
            query: homeTeam,
            fields: ['home_team_en', 'home_team_fa', 'away_team_en', 'away_team_fa', 'venue_name_en', 'venue_name_fa'],
            fuzziness: 'AUTO'
          }
        });
      }
      if (awayTeam) {
        mustQueries.push({
          multi_match: {
            query: awayTeam,
            fields: ['home_team_en', 'home_team_fa', 'away_team_en', 'away_team_fa'],
            fuzziness: 'AUTO'
          }
        });
      }
      if (venue) {
        mustQueries.push({
          multi_match: {
            query: venue,
            fields: ['venue_name_en', 'venue_name_fa'],
            fuzziness: 'AUTO'
          }
        });
      }
      if (maxPrice) {
        mustQueries.push({ range: { price: { lte: parseFloat(maxPrice) } } });
      }

      const response = await esClient.search({
        index: this.INDEX_NAME,
        body: {
          query: { bool: { must: mustQueries } },
          sort: [{ match_time: { order: 'asc' } }]
        }
      });

      return response.hits.hits.map(hit => hit._source);
    } catch (e) {
      console.error('Elasticsearch search failure:', e.message);
      return [];
    }
  }

  // ۵. پیشنهادات هوشمند (Autocomplete) چندزبانه
  static async autocomplete(term) {
    try {
      const response = await esClient.search({
        index: this.INDEX_NAME,
        body: {
          query: {
            multi_match: {
              query: term,
              type: 'bool_prefix',
              fields: [
                'home_team_en.autocomplete',
                'home_team_fa.autocomplete',
                'away_team_en.autocomplete',
                'away_team_fa.autocomplete',
                'venue_name_en.autocomplete',
                'venue_name_fa.autocomplete'
              ]
            }
          },
          size: 5
        }
      });
      return response.hits.hits.map(hit => hit._source);
    } catch (e) {
      console.error('Autocomplete query failed:', e.message);
      return [];
    }
  }
}