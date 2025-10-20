/**
 * Test Suite for HTML to Dumbdown Conversion
 */

const { Converter } = require('./converter');

describe('Converter - HTML to Dumbdown', () => {
  describe('Headings', () => {
    test('converts H1 to underlined format', () => {
      const html = '<h1>Main Title</h1>';
      const result = Converter.convert(html);
      expect(result).toContain('Main Title');
      expect(result).toContain('='.repeat('Main Title'.length));
    });

    test('converts H2 to dashed format', () => {
      const html = '<h2>Subtitle</h2>';
      const result = Converter.convert(html);
      expect(result).toContain('Subtitle');
      expect(result).toContain('-'.repeat('Subtitle'.length));
    });

    test('converts H3 to slash prefix format', () => {
      const html = '<h3>Small Heading</h3>';
      const result = Converter.convert(html);
      expect(result).toContain('// Small Heading');
    });
  });

  describe('Paragraphs and Text', () => {
    test('converts simple paragraph', () => {
      const html = '<p>This is a paragraph.</p>';
      const result = Converter.convert(html);
      expect(result).toContain('This is a paragraph.');
    });

    test('handles multiple paragraphs with spacing', () => {
      const html = '<p>First paragraph.</p><p>Second paragraph.</p>';
      const result = Converter.convert(html);
      expect(result).toContain('First paragraph.');
      expect(result).toContain('Second paragraph.');
    });

    test('normalizes whitespace in text', () => {
      const html = '<p>Text   with   multiple    spaces</p>';
      const result = Converter.convert(html);
      expect(result).toContain('Text with multiple spaces');
    });
  });

  describe('Emphasis', () => {
    test('converts bold to uppercase', () => {
      const html = '<p>This is <b>important</b> text.</p>';
      const result = Converter.convert(html);
      expect(result).toContain('IMPORTANT');
    });

    test('converts strong to uppercase', () => {
      const html = '<p>This is <strong>critical</strong> information.</p>';
      const result = Converter.convert(html);
      expect(result).toContain('CRITICAL');
    });

    test('converts italic to uppercase', () => {
      const html = '<p>This is <i>emphasized</i> text.</p>';
      const result = Converter.convert(html);
      expect(result).toContain('EMPHASIZED');
    });
  });

  describe('Code', () => {
    test('converts inline code to backticks', () => {
      const html = '<p>Use <code>console.log()</code> to debug.</p>';
      const result = Converter.convert(html);
      expect(result).toContain('`console.log()`');
    });

    test('converts code blocks with triple backticks', () => {
      const html = '<pre>function hello() {\n  console.log("world");\n}</pre>';
      const result = Converter.convert(html);
      expect(result).toContain('```');
      expect(result).toContain('function hello()');
    });
  });

  describe('Unordered Lists', () => {
    test('converts simple unordered list', () => {
      const html = '<ul><li>Item one</li><li>Item two</li><li>Item three</li></ul>';
      const result = Converter.convert(html);
      expect(result).toContain('- Item one');
      expect(result).toContain('- Item two');
      expect(result).toContain('- Item three');
    });

    test('handles nested unordered lists', () => {
      const html = '<ul><li>Item one<ul><li>Nested item</li></ul></li></ul>';
      const result = Converter.convert(html);
      expect(result).toContain('- Item one');
      expect(result).toContain('-- Nested item');
    });
  });

  describe('Ordered Lists', () => {
    test('converts simple ordered list', () => {
      const html = '<ol><li>First</li><li>Second</li><li>Third</li></ol>';
      const result = Converter.convert(html);
      expect(result).toContain('1. First');
      expect(result).toContain('2. Second');
      expect(result).toContain('3. Third');
    });
  });

  describe('Blockquotes', () => {
    test('converts blockquote to quoted format', () => {
      const html = '<blockquote>This is a quote.</blockquote>';
      const result = Converter.convert(html);
      expect(result).toContain('"This is a quote."');
    });
  });

  describe('Links', () => {
    test('extracts link URLs', () => {
      const html = '<p>Visit <a href="https://example.com">our site</a> for more.</p>';
      const result = Converter.convert(html);
      expect(result).toContain('https://example.com');
    });
  });

  describe('Complex Content', () => {
    test('converts mixed content correctly', () => {
      const html = `
        <h1>My Article</h1>
        <p>This is an article with <b>bold text</b>.</p>
        <ul>
          <li>Point one</li>
          <li>Point two</li>
        </ul>
        <p>Here is some <code>code</code>.</p>
      `;
      const result = Converter.convert(html);

      expect(result).toContain('My Article');
      expect(result).toContain('=');
      expect(result).toContain('BOLD TEXT');
      expect(result).toContain('- Point one');
      expect(result).toContain('`code`');
    });

    test('handles real-world HTML with whitespace issues', () => {
      const html = `
        <div>
          <h2>   Section Title   </h2>
          <p>
            Paragraph with
            extra
            whitespace.
          </p>
          <ul>
            <li>First item</li>
            <li>Second item</li>
          </ul>
        </div>
      `;
      const result = Converter.convert(html);

      expect(result).toContain('Section Title');
      expect(result).not.toContain('   '); // No triple spaces
      expect(result).toContain('Paragraph with extra whitespace.');
    });
  });

  describe('Error Handling', () => {
    test('throws error on invalid input', () => {
      expect(() => Converter.convert(null)).toThrow();
      expect(() => Converter.convert(undefined)).toThrow();
      expect(() => Converter.convert(123)).toThrow();
    });

    test('handles empty HTML', () => {
      const result = Converter.convert('');
      expect(result).toBe('');
    });
  });

  describe('Whitespace Normalization', () => {
    test('removes excessive newlines', () => {
      const html = '<p>First</p><br><br><br><p>Second</p>';
      const result = Converter.convert(html);
      const newlineCount = (result.match(/\n/g) || []).length;
      expect(newlineCount).toBeLessThan(5); // Should not have excessive newlines
    });

    test('preserves code block formatting', () => {
      const html = '<pre>line 1\nline 2\nline 3</pre>';
      const result = Converter.convert(html);
      expect(result).toContain('line 1');
      expect(result).toContain('line 2');
      expect(result).toContain('line 3');
    });
  });
});
