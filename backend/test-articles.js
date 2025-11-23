import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Environment check:');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI starts with:', process.env.MONGODB_URI?.substring(0, 20) + '...');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'agentic_ai_db';
const ARTICLES_COLLECTION = 'articles';

async function testArticles() {
  let client;
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined. Check your .env file!');
    }

    console.log('\nConnecting to MongoDB...');
    client = await MongoClient.connect(MONGODB_URI);
    console.log('✅ Connected successfully!');
    
    const db = client.db(DB_NAME);
    
    const articles = await db
      .collection(ARTICLES_COLLECTION)
      .find({})
      .limit(5)
      .toArray();
    
    console.log('\n📊 Total articles found:', articles.length);
    
    if (articles.length === 0) {
      console.log('\n⚠️  No articles in database!');
      console.log('Run your Python scraper script first to populate articles.');
    } else {
      console.log('\n📰 Sample articles:');
      articles.forEach((article, index) => {
        console.log(`\n--- Article ${index + 1} ---`);
        console.log('ID:', article._id);
        console.log('Title:', article.title);
        console.log('URL:', article.url);
        console.log('URL type:', typeof article.url);
        console.log('Has full_text:', !!article.full_text);
        console.log('Has summary:', !!article.summary);
        console.log('Category:', article.category);
        console.log('Source:', article.source_name);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (client) {
      await client.close();
      console.log('\n✅ Connection closed');
    }
  }
}

testArticles();