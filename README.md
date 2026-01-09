+++

// Dumbdown v2

Convert Markdown to clean, human-readable dumbdown format.

/// What is Dumbdown?

Dumbdown is a text formatting system designed for humans, not machines. Unlike Markdown or HTML, dumbdown is immediately readable without any rendering - what you see in plain text is what you get.

Key principles:
- Human-readable first
- No rendering required
- Simple, consistent rules
- Two heading levels (// and ///)
- Plain text emphasis (ALL CAPS)

/// Features

- Markdown to Dumbdown converter (primary)
- HTML to Dumbdown converter (secondary)
- Clean three-layer architecture
- Preserves LaTeX math expressions
- REST API for integration
- Comprehensive test suite

/// Quick Start

Install dependencies:
```
npm install
```

Start the server:
```
npm start
```

Visit http://localhost:3000

/// API Usage

Convert Markdown to Dumbdown:
```
POST /convert-markdown
Content-Type: application/json

{
  "markdown": "# Hello World\n\nThis is **bold** text."
}
```

Response:
```
{
  "success": true,
  "dumbdown": "+++\n\n// Hello World\n\nThis is BOLD text.\n\n+++"
}
```

HTML conversion is also supported via POST /convert endpoint.

/// Architecture

Dumbdown uses a three-layer pipeline:

1. Parser - Converts input (HTML or Markdown) to semantic tree
2. Normalizer - Cleans and optimizes the tree structure
3. Serializer - Outputs clean dumbdown text

For Markdown conversion:
- Headings: # -> //, ## and beyond -> ///
- Bold/Italic: **text** or *text* -> TEXT
- Lists: - item -> - item (with -- for nesting)
- Code: Backticks preserved
- Math: LaTeX expressions protected

/// Dumbdown Format

Document markers:
```
+++
// Your content here
+++
```

Headings:
```
// Main Title
/// Subtitle
```

Lists:
```
- First item
- Second item
-- Nested item
```

Emphasis:
```
This is IMPORTANT text.
```

Code:
```
Inline: `code here`

Block:
```
code block
```
```

Labels:
```
[NOTE] Additional context
[WARNING] Important warning
```

Callouts:
```
!! Action required
>> Key insight
```

Quotes:
```
"This is a quoted section."
```

/// Testing

Run tests:
```
npm test
```

The test suite covers 22 scenarios including edge cases, nested structures, and whitespace handling.

/// Deployment

The project is configured for Cloudflare Pages:
- Static files served from /public
- API endpoints in /functions directory
- Auto-deploys on push to main branch

Connect your GitHub repo to Cloudflare Pages and it will handle the rest.

/// Project Structure

```
dumbdown/
├── src/
│   ├── parser.js              # HTML parsing
│   ├── normalizer.js          # Tree cleanup
│   ├── serializer.js          # Dumbdown output
│   ├── converter.js           # HTML converter
│   ├── markdown-converter.js  # Markdown converter (primary)
│   ├── server.js              # Express server
│   └── converter.test.js      # Test suite
├── functions/
│   ├── convert-markdown.js    # Cloudflare Pages Function
│   ├── convert.js             # HTML conversion endpoint
│   └── health.js              # Health check
├── public/
│   ├── index.html             # Web UI
│   └── script.js              # Frontend logic
└── package.json
```

/// Design Decisions

- Two heading levels only (// and ///) - deeper nesting is unnecessary
- ALL CAPS for emphasis - no special markers needed
- Document markers (+++) - clear start and end boundaries
- LaTeX math preserved - technical documents fully supported
- List nesting via repeated dashes - simple and visual

/// Contributing

This is a focused project with a clear scope. The format is stable and the implementation is complete.

+++
