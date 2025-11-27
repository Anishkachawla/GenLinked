import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Ensure dotenv is loaded
dotenv.config();

const router = express.Router(); 

// Check if MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI is not defined in environment variables!');
  console.error('Make sure your .env file exists in the backend folder with:');
  console.error('MONGODB_URI=mongodb+srv://...');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'agentic_ai_db';
const ARTICLES_COLLECTION = 'articles';

// Helper function to safely connect/close client
async function withDb(callback) {
  let client;
  try {
    console.log('Connecting to MongoDB...');
    client = await MongoClient.connect(MONGODB_URI);
    console.log('MongoDB connected');
    const db = client.db(DB_NAME);
    return await callback(db);
  } catch (error) {
    console.error('Database connection error:', error.message);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Get all articles
router.get('/', async (req, res) => {
  console.log('GET /api/articles - Fetching all articles');
  try {
    const articles = await withDb(async (db) => {
      const result = await db
        .collection(ARTICLES_COLLECTION)
        .find({})
        .sort({ created_at: -1 })
        .limit(50)
        .toArray();
      
      console.log(`Found ${result.length} articles`);
      return result;
    });
    
    res.json({ success: true, articles });
  } catch (error) {
    console.error('Error fetching articles:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch articles'
    });
  }
});

// Get single article by ID
router.get('/:id', async (req, res) => {
  console.log(`GET /api/articles/${req.params.id} - Fetching single article`);
  try {
    const article = await withDb(async (db) => {
      return db
        .collection(ARTICLES_COLLECTION)
        .findOne({ _id: new ObjectId(req.params.id) });
    });
    
    if (!article) {
      console.log('Article not found');
      return res.status(404).json({ success: false, error: 'Article not found' });
    }
    
    console.log('Article found:', article.title);
    res.json({ success: true, article });
  } catch (error) {
    console.error('Error fetching article:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch article'
    });
  }
});

// Gemini summarization
router.post('/summarize', async (req, res) => {
  console.log('POST /api/articles/summarize (Gemini)');
  
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required and must be a string'
      });
    }

    if (text.length < 100) {
      return res.status(400).json({
        success: false,
        error: 'Text too short to summarize (minimum 100 characters)'
      });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured'
      });
    }

    const GEMINI_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      GEMINI_API_KEY;

    console.log("Gemini Request URL:", GEMINI_URL);

    console.log('Calling Gemini API...');

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", JSON.stringify(data, null, 2));
      return res.status(500).json({
        success: false,
        error: data.error?.message || "Gemini API failed"
      });
    }

    const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      return res.status(500).json({
        success: false,
        error: "Gemini returned no summary"
      });
    }

    console.log('Summary generated');
    res.json({ success: true, summary });

  } catch (error) {
    console.error('Error in /summarize:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Unexpected server error'
    });
  }
});

// Generate LinkedIn-style post
router.post('/generate-post', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.length < 100) {
      return res.status(400).json({
        success: false,
        error: "Not enough content to generate a LinkedIn post."
      });
    }

    const GEMINI_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      process.env.GEMINI_API_KEY;

    const prompt = `
      Write a LinkedIn-style post based on the following article content.

      Guidelines:
      - Professional tone
      - Strong hook in first line
      - 2–4 short paragraphs
      - Add insights or key takeaways
      - Add 3–5 relevant hashtags at the end
      - No emojis unless essential

      CONTENT:
      ${text}
      `;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    const post =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Unable to generate post.";

    res.json({ success: true, post });

  } catch (error) {
    console.error("LinkedIn post error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate LinkedIn post."
    });
  }
});


export default router;