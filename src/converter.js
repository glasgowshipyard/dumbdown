/**
 * Main Converter - Orchestrates the HTML to Dumbdown pipeline
 * Pipeline: HTMLParser -> Normalizer -> Serializer
 */

const { HTMLParser } = require('./parser');
const { Normalizer } = require('./normalizer');
const { Serializer } = require('./serializer');

class Converter {
  /**
   * Convert HTML to Dumbdown format
   * @param {string} html - The HTML string to convert
   * @returns {string} - Dumbdown formatted text
   */
  static convert(html) {
    if (typeof html !== 'string') {
      throw new Error('Invalid HTML input');
    }

    if (!html) {
      return '';
    }

    try {
      // Step 1: Parse HTML into semantic tree
      const parser = new HTMLParser(html);
      const semanticTree = parser.parse();

      // Step 2: Normalize whitespace and structure
      const normalizer = new Normalizer();
      const normalizedTree = normalizer.normalize(semanticTree);

      // Step 3: Serialize to Dumbdown format
      const serializer = new Serializer();
      const dumbdownText = serializer.serialize(normalizedTree);

      return dumbdownText;
    } catch (error) {
      console.error('Conversion error:', error);
      throw error;
    }
  }
}

module.exports = { Converter };
