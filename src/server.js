/**
 * Dumbdown Express Server
 * Provides API endpoint for HTML to Dumbdown conversion
 */

import express from 'express';
import path from 'path';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { Converter } from './converter.js';
import { MarkdownConverter } from './markdown-converter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Conversion API endpoint (HTML to Dumbdown)
app.post('/convert', (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Please provide HTML text in the request body as { text: "..." }'
      });
    }

    const result = Converter.convert(text);
    res.json({
      success: true,
      dumbdown: result
    });
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});

// Markdown to Dumbdown conversion endpoint
app.post('/convert-markdown', (req, res) => {
  try {
    const { markdown } = req.body;

    if (!markdown || typeof markdown !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Please provide markdown text in the request body as { markdown: "..." }'
      });
    }

    const result = MarkdownConverter.convert(markdown);
    res.json({
      success: true,
      dumbdown: result
    });
  } catch (error) {
    console.error('Markdown conversion error:', error);
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'Endpoint not found. Try POST /convert or GET /health'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Dumbdown server running on http://localhost:${PORT}`);
  console.log(`API endpoint: POST /convert`);
  console.log(`Health check: GET /health`);
});
