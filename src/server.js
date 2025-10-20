/**
 * Dumbdown Express Server
 * Provides API endpoint for HTML to Dumbdown conversion
 */

const express = require('express');
const path = require('path');
const compression = require('compression');
const { Converter } = require('./converter');

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

// Conversion API endpoint
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
