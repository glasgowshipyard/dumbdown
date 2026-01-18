+++

// Dumbdown v2

Convert Markdown to clean, human-readable dumbdown format.

/// What is Dumbdown?

Dumbdown is a text formatting system designed for humans, not machines. Unlike Markdown or HTML, dumbdown is immediately readable without any rendering - what you see in plain text is what you get.
```
Key principles:
- Human-readable first
- No rendering required
- Simple, consistent rules
- Two heading levels
-- // Heading One
-- /// Heading Two
- Plain text emphasis (ALL CAPS)
```
/// Features
```
- Markdown to Dumbdown converter (primary)
- HTML to Dumbdown converter (secondary)
- Clean three-layer architecture
- Preserves LaTeX math expressions
- REST API for integration
- Comprehensive test suite
```
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
```
- Headings: # -> //, ## and beyond -> ///
- Bold/Italic: **text** or *text* -> TEXT
- Lists: - item -> - item (with -- for nesting)
- Code: Backticks preserved
- Math: LaTeX expressions protected
```

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
```

Code Block:
```
Conventional backtics

code block

Conventional closure
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

+++
