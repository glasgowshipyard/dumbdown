# Dumbdown MVP: HTML→Dumbdown Conversion

## What Dumbdown v2 Actually Is (From Cheatsheet)

### Structure
- **Document markers**: `+++` at top and bottom
- **Titles**: `// Example Title` (commented style, not underlined)
- **Subtitles**: `/// Example Subtitle`
- **Emphasis**: ALL CAPS only (no bold/italic markers)
- **Code**: Backticks inline `` `code` ``, triple-backticks blocks
- **Quotes**: Natural `"quoted text"` (multi-line works)
- **Lists**: 
  - `-` for main bullets
  - `--` for sub-bullets (exactly 2 spaces before)
  - `1.` for ordered, same nesting
- **Labels**: `[NOTE]`, `[WARNING]`, `[ERROR]` context markers
- **Callouts**: `!!` (action required), `>>` (key insight)

### Core Rule
**Maximum readability. No formatting cruft. Structure only.**

---

## The Real Problem

When you copy-paste HTML from a website, it comes with:
- Extra whitespace (multiple newlines, indentation, nested divs)
- Nested semantic tags that don't matter (`<span>`, `<article>`, etc.)
- Mixed content (text nodes + elements)
- Accidental line breaks inside sentences

**Result**: After conversion, output has too much vertical space and janky formatting.

---

## MVP Scope

**Goal**: Convert HTML → clean Dumbdown text
- ✓ Parse HTML correctly (headers, lists, emphasis, code, quotes, callouts)
- ✓ Handle whitespace aggressively (collapse extra space, normalize lines)
- ✓ Single endpoint: `/convert` (take raw HTML, return Dumbdown)
- ✗ No sessions/sharing yet
- ✗ No file upload yet
- ✗ No Pages/UI yet (just API + test harness)

**Success**: Paste messy HTML, get clean Dumbdown output with sensible spacing.

---

## Implementation Plan: Phase 0 Only

### 1. **Semantic Parser** (`src/parse/semantic.js`)
Convert HTML tree → intermediate structure that knows about:
- Block elements (headers, paragraphs, lists, code blocks, quotes)
- Inline elements (emphasis, links, code)
- Nesting relationships
- Text content (stripped of markup)

**Key**: Discard styling completely. Only capture structure and text.

### 2. **Whitespace Normalizer** (`src/normalize.js`)
**This is the main issue to solve.**

Rules:
- Collapse multiple newlines to single newline
- Trim trailing/leading whitespace on every line
- Strip blank lines at start/end of output
- Don't add extra blank lines between sections
- Preserve exactly one blank line between major sections (headers, list groups)

### 3. **Dumbdown Serializer** (`src/serialize.js`)
Walk semantic tree top-to-bottom:
- Headers → `// Title` or `/// Subtitle`
- Emphasis → UPPERCASE
- Lists → `-` or `--` with correct nesting
- Code → backticks
- Quotes → `"text"`
- Callouts → `[NOTE]`, `>>`, `!!`
- Paragraphs → plain text (collapse internal whitespace)

**Key**: Build output line-by-line, then normalize at the end.

### 4. **Worker Endpoint** (`src/worker.js`)
```
POST /convert
Content-Type: application/json
Body: { "html": "<h1>Title</h1>..." }
Response: { "dumbdown": "// Title\n..." }
```

### 5. **Tests** (`tests/`)
Input/output pairs:
- Messy copied HTML → expected clean output
- Nested lists → correct `--` formatting
- Multiple whitespace → single newlines
- Mixed content (text + elements) → sensible output

---

## The Core Algorithm

### Whitespace Strategy (THE FIX)

**Problem**: HTML trees have junk whitespace everywhere.

```html
<div>
  <h1>
    Title
  </h1>
  
  <p>Text here</p>
  
  <ul>
    <li>Item</li>
    <li>Item</li>
  </ul>
</div>
```

After naive parsing → looks like:
```
\n  \n    Title\n  \n
\n  \n Text here \n  \n
- Item
- Item
```

**Solution**:
1. Extract only text nodes (recursively, respecting block boundaries)
2. Join text at block level with NO extra space
3. Normalize output AFTER serialization:
   - Split by `\n`
   - Filter out empty lines
   - Rejoin with single `\n`
   - Add intentional blank lines only between major sections

### Parsing Rules

**Block-level elements**: Headers, paragraphs, lists, code blocks, quotes, divs
- Extract content
- Add section break after (one blank line)

**Inline elements**: `<b>`, `<strong>`, `<i>`, `<em>`
- Convert text to UPPERCASE
- Strip tags

**Text nodes**: 
- Trim whitespace
- Collapse internal whitespace (multiple spaces → single space)
- Preserve single spaces

**Lists**:
- Track nesting depth
- Direct `<li>` children of `<ul>` → `-`
- Nested `<ul>` inside `<li>` → `--` (2 spaces)
- Ordered same logic with numbers

---

## File Structure

```
dumbdown/
├── src/
│   ├── parse/
│   │   └── semantic.js        # HTML → semantic tree
│   ├── normalize.js            # Whitespace rules
│   ├── serialize.js            # Tree → Dumbdown text
│   └── worker.js               # Hono endpoint
├── tests/
│   ├── fixtures/
│   │   ├── messy-copypasta.html
│   │   ├── nested-lists.html
│   │   ├── emphasis.html
│   │   └── expected-output.txt
│   └── integration.test.js
├── wrangler.toml               # Cloudflare config
├── package.json
└── README.md
```

---

## Success Criteria (MVP)

✅ Paste messy website HTML into `/convert` endpoint
✅ Get back clean, readable Dumbdown
✅ No extra blank lines or weird spacing
✅ Lists format correctly (no indentation issues)
✅ Emphasis converts to UPPERCASE
✅ Code blocks preserved
✅ Quotes work
✅ Callouts work (if in source HTML)

---

## Next: Lock In Whitespace Rules

Before coding, answer:
1. **Section breaks**: Always one blank line between sections? Or context-dependent?
2. **Paragraph spacing**: Do paragraphs get blank lines between them?
3. **List spacing**: Blank line after a list, before next section?
4. **Code blocks**: Blank line before/after?
5. **Callouts**: Treated as sections (blank line after)?

Example—should this:
```html
<p>Paragraph 1</p>
<p>Paragraph 2</p>
<ul><li>Item 1</li></ul>
<p>Paragraph 3</p>
```

Become:
```
Paragraph 1

Paragraph 2

- Item 1

Paragraph 3
```

Or:
```
Paragraph 1
Paragraph 2

- Item 1

Paragraph 3
```

Lock these in, then code is straightforward.
