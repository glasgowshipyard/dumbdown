/**
 * Markdown to Dumbdown Converter
 * Converts Markdown syntax to Dumbdown format
 */

export class MarkdownConverter {
  /**
   * Convert Markdown to Dumbdown
   * @param {string} markdown - The Markdown text to convert
   * @returns {string} - The converted Dumbdown text
   */
  static convert(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      throw new Error('Invalid markdown input');
    }

    let result = markdown;

    // Protect LaTeX math expressions from conversion
    const mathBlocks = [];
    // Match both inline $...$ and display $$...$$ math
    result = result.replace(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g, (match) => {
      const placeholder = `__MATH_${mathBlocks.length}__`;
      mathBlocks.push(match);
      return placeholder;
    });

    // Convert headings: # -> //, ## -> ///, #### and beyond -> ///
    // Also strip bold/italic formatting from headings (headings don't need it in dumbdown)
    // H4+ all become H3 (/// ) since //// is pointless
    result = result.replace(/^#{4,}\s+(.+)$/gm, (match, title) => `/// ${title.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')}`);
    result = result.replace(/^###\s+(.+)$/gm, (match, title) => `/// ${title.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')}`);
    result = result.replace(/^##\s+(.+)$/gm, (match, title) => `/// ${title.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')}`);
    result = result.replace(/^#\s+(.+)$/gm, (match, title) => `// ${title.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')}`);

    // Process lists first, then handle formatting within list items
    const lines = result.split('\n');
    const processedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match list items with indentation
      const listMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);

      if (listMatch) {
        const indent = listMatch[1];
        const content = listMatch[2];
        const indentLevel = Math.floor(indent.length / 2);

        // Create dashes based on nesting level
        const dashes = '-'.repeat(indentLevel + 1);
        processedLines.push(`${dashes} ${content}`);
      } else {
        // Convert ordered lists
        const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
        if (orderedMatch) {
          const indent = orderedMatch[1];
          const number = orderedMatch[2];
          const content = orderedMatch[3];
          const indentLevel = Math.floor(indent.length / 2);

          if (indentLevel > 0) {
            // Nested ordered items use dashes
            const dashes = '-'.repeat(indentLevel + 1);
            processedLines.push(`${dashes} ${content}`);
          } else {
            // Top-level ordered items keep numbers
            processedLines.push(`${number}. ${content}`);
          }
        } else {
          processedLines.push(line);
        }
      }
    }

    result = processedLines.join('\n');

    // Convert bold and italic formatting (after list processing to avoid breaking list markers)
    // Convert bold: **text** or __text__ -> TEXT (non-greedy, single line only)
    result = result.replace(/\*\*([^*\n]+?)\*\*/g, (match, text) => text.toUpperCase());
    result = result.replace(/__([^_\n]+?)__/g, (match, text) => text.toUpperCase());

    // Convert italic: *text* or _text_ -> TEXT (non-greedy, single line only)
    // Use spaces as boundaries to avoid matching list markers
    result = result.replace(/(\s)\*([^*\n]+?)\*(\s|[,.]|$)/g, (match, before, text, after) => `${before}${text.toUpperCase()}${after}`);
    result = result.replace(/(\s)_([^_\n]+?)_(\s|[,.]|$)/g, (match, before, text, after) => `${before}${text.toUpperCase()}${after}`);

    // Convert blockquotes: > text -> "text"
    result = result.replace(/^>\s+(.+)$/gm, '"$1"');

    // Convert horizontal rules to blank lines (dumbdown uses spacing)
    result = result.replace(/^([-*_]){3,}$/gm, '');

    // Code blocks are already using backticks, so they're compatible
    // Inline code already uses backticks, so it's compatible

    // Clean up multiple blank lines
    result = result.replace(/\n{3,}/g, '\n\n');

    // Restore LaTeX math expressions
    mathBlocks.forEach((math, index) => {
      result = result.replace(`__MATH_${index}__`, math);
    });

    // Trim trailing whitespace
    result = result.trim();

    // Add document markers: +++ at top and bottom
    result = `+++\n\n${result}\n\n+++`;

    return result;
  }
}
