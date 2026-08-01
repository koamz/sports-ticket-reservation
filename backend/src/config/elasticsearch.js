import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

// esClient.info()
//  .then(() => console.log('Successfully connected to Elasticsearch Server.'))
//  .catch((err) => console.error('Elasticsearch connection failure:', err.message));

export default esClient;