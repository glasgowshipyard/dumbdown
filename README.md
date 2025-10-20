# Dumbdown v2

A clean, modern HTML to Dumbdown converter. Built from scratch with a three-layer architecture: Parser → Normalizer → Serializer.

## Overview

Dumbdown is a simpler alternative to Markdown that strips away formatting cruft while maintaining structural clarity. This project provides:

- **Web UI** - Paste HTML, click convert, copy the result
- **REST API** - `/convert` endpoint for programmatic use
- **Test Suite** - 22 comprehensive tests ensuring quality
- **Clean Architecture** - Semantic parsing with proper whitespace normalization

## Quick Start

### Prerequisites
- Node.js 14+
- npm

### Installation & Setup

```bash
# Install dependencies
npm install

# Start the server
npm start
# Server runs on http://localhost:3000
```

### Using the Web UI

1. Open http://localhost:3000 in your browser
2. Paste HTML content into the left pane
3. Click "Convert" or press `Ctrl+Enter`
4. Output appears in the right pane
5. Click "Copy" to copy to clipboard

### Using the API

```bash
curl -X POST http://localhost:3000/convert \
  -H "Content-Type: application/json" \
  -d '{"text": "<h1>Title</h1><p>Hello <b>world</b></p>"}'
```

Response:
```json
{
  "success": true,
  "dumbdown": "Title\n=====\n\nHello WORLD"
}
```

## Architecture

### Three-Layer Pipeline

The conversion process follows a clean separation of concerns:

```
HTML Input
    ↓
[Parser] → Semantic Tree
    ↓
[Normalizer] → Clean Tree
    ↓
[Serializer] → Dumbdown Text
    ↓
Output
```

#### 1. **Parser** (`src/parser.js`)
Converts messy HTML into a clean semantic tree structure.

**Features:**
- Removes unnecessary elements (script, style, meta, etc.)
- Handles nested lists with proper depth tracking
- Distinguishes between block and inline elements
- Preserves semantic meaning (emphasis, code, links, quotes)

**Semantic Node Types:**
- Block: heading, paragraph, list, list_item, code_block, blockquote, callout
- Inline: text, emphasis, inline_code, link
- Container: root

#### 2. **Normalizer** (`src/normalizer.js`)
Cleans up the semantic tree by fixing whitespace issues BEFORE serialization.

**Key Responsibilities:**
- Removes excessive whitespace in text nodes
- Collapses consecutive text nodes
- Removes empty nodes that don't contribute meaning
- Preserves leaf nodes (headings, code) even if they have no children

#### 3. **Serializer** (`src/serializer.js`)
Converts the normalized semantic tree into Dumbdown formatted text.

**Output Format:**
- Headings: underline with `=` (H1) or `-` (H2)
- Emphasis: ALL CAPS
- Code: backticks
- Lists: `-` (bullets), `1.` (ordered), `--` (nested)
- Blockquotes: natural `"quoted"` format
- Callouts: `[WARNING]`, `[NOTE]`, etc.

## Dumbdown Format Reference

```dumbdown
Title
=====

Subtitle
--------

/// Smaller Heading

This is a paragraph with BOLD and ITALIC text.

Use `inline_code()` for code.

- Bullet point
- Another bullet
  -- Nested bullet
  -- Another nested

1. First item
2. Second item
3. Third item

"This is a blockquote"

```
Code block with multiple lines
More code here
```

[WARNING] This is important
[NOTE] This is informational
>> Key insight
!! Action required
```

## Testing

The project includes a comprehensive test suite:

```bash
npm test                  # Run all tests
npm test -- --coverage   # With coverage report
```

**Test Coverage:**
- ✓ Headings (H1-H6)
- ✓ Paragraphs and text normalization
- ✓ Emphasis (bold, italic)
- ✓ Inline and block code
- ✓ Unordered lists with nesting
- ✓ Ordered lists
- ✓ Blockquotes
- ✓ Links
- ✓ Complex mixed content
- ✓ Real-world HTML with whitespace issues
- ✓ Error handling
- ✓ Whitespace edge cases

All 22 tests passing ✓

## Project Structure

```
dumbdown/
├── src/
│   ├── parser.js          # HTML → Semantic Tree
│   ├── normalizer.js      # Semantic Tree cleanup
│   ├── serializer.js      # Semantic Tree → Dumbdown
│   ├── converter.js       # Orchestrates pipeline
│   ├── server.js          # Express server
│   └── converter.test.js  # Test suite
├── public/
│   ├── index.html         # Web UI
│   └── script.js          # Frontend logic
├── package.json
├── README.md (this file)
├── DUMBDOWN CHEATSHEET.txt    # Format spec
├── dumbdown_strategy.md       # MVP strategy
└── _old/                      # Previous implementation (archived)
```

## Key Design Decisions

### 1. **Semantic Parsing**
Instead of doing string manipulation on raw HTML, we parse into a semantic tree. This allows proper handling of nested structures and makes the serialization logic clean and predictable.

### 2. **Whitespace Normalization Before Serialization**
The old implementation had issues because it tried to fix whitespace AFTER all transformations. By normalizing the tree structure first, we avoid interference between transformation steps.

### 3. **Three Distinct Modules**
Each module has a single responsibility:
- Parser: understand HTML
- Normalizer: clean data
- Serializer: format output

This makes debugging easier and testing more comprehensive.

### 4. **Leaf Node Semantics**
Some nodes (headings, code) don't have children but contain meaningful content. The normalizer preserves these, while removing truly empty container nodes.

### 5. **Parent Type Tracking**
Lists nested inside list items have different formatting than top-level lists. We track parent node type to handle this correctly.

## API Endpoints

### `POST /convert`
Convert HTML to Dumbdown format.

**Request:**
```json
{
  "text": "<h1>Example</h1>..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "dumbdown": "Example\n=======\n..."
}
```

**Response (Error):**
```json
{
  "error": "Conversion failed",
  "message": "Details about what went wrong"
}
```

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Deployment

### Heroku

The project includes a `Procfile` for easy Heroku deployment:

```bash
git push heroku main
heroku open
```

### Environment Variables

- `PORT` - Server port (default: 3000)

### Other Platforms

Works on any Node.js hosting (AWS Lambda, DigitalOcean, Vercel, etc.)

## Performance Notes

- Typical HTML conversion: < 100ms
- No external API calls
- Memory footprint: minimal (single-pass processing)
- Scales well with reasonable HTML sizes (tested up to 1MB+)

## Limitations & Future Work

- **No CSS processing** - Styles are stripped, focus is on semantic content
- **Link handling** - Currently extracts URLs only (could preserve link text)
- **Images** - Not handled (could add image reference syntax)
- **Tables** - Not yet supported
- **Custom Dumbdown features** - Could add footnotes, citations, etc.

## Development

### Adding New Element Support

1. Add parsing logic to `src/parser.js`
2. Create semantic node type if needed
3. Update `src/normalizer.js` if special handling needed
4. Add serialization in `src/serializer.js`
5. Add test cases to `src/converter.test.js`
6. Run `npm test` to verify

### Debugging

Enable debug output:

```javascript
// In converter.js
console.log('Parse tree:', JSON.stringify(semanticTree, null, 2));
```

## References

- **Original Strategy**: See `dumbdown_strategy.md`
- **Format Spec**: See `DUMBDOWN CHEATSHEET.txt`
- **Previous Version**: See `_old/` directory (archived)

## License

ISC

## Contributors

Claude (Anthropic)

---

Built with clean architecture principles and test-driven development.
