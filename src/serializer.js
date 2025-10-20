/**
 * Dumbdown Serializer
 * Converts semantic tree to Dumbdown formatted text
 */

export class Serializer {
  constructor() {
    this.output = [];
    this.lastNodeType = null;
  }

  /**
   * Serialize semantic tree to Dumbdown text
   */
  serialize(semanticTree) {
    this.output = [];
    this.lastNodeType = null;

    // Skip root node, process children
    if (semanticTree.children) {
      semanticTree.children.forEach((child, idx) => {
        this.serializeNode(child);
      });
    }

    return this.output.join('\n').trim();
  }

  /**
   * Recursively serialize nodes
   */
  serializeNode(node, parentType = null) {
    if (!node) return;

    // Add spacing between block-level elements
    if (this.shouldAddSpacing(node, parentType)) {
      this.output.push('');
    }

    switch (node.type) {
      case 'text':
        this.output.push(node.content);
        break;

      case 'heading':
        this.serializeHeading(node);
        break;

      case 'paragraph':
        this.serializeParagraph(node);
        break;

      case 'list':
        this.serializeList(node);
        break;

      case 'list_item':
        this.serializeListItem(node);
        break;

      case 'code_block':
        this.serializeCodeBlock(node);
        break;

      case 'blockquote':
        this.serializeBlockquote(node);
        break;

      case 'callout':
        this.serializeCallout(node);
        break;

      case 'root':
      default:
        if (node.children) {
          node.children.forEach((child, idx) => {
            this.serializeNode(child, node.type);
          });
        }
    }

    this.lastNodeType = node.type;
  }

  /**
   * Serialize heading
   */
  serializeHeading(node) {
    const { level } = node.meta;
    if (level === 1) {
      this.output.push(node.content);
      this.output.push('='.repeat(node.content.length));
    } else if (level === 2) {
      this.output.push(node.content);
      this.output.push('-'.repeat(node.content.length));
    } else {
      // H3-H6 use prefix syntax
      const prefix = '/'.repeat(level - 1);
      this.output.push(`${prefix} ${node.content}`);
    }
  }

  /**
   * Serialize paragraph - render inline children
   */
  serializeParagraph(node) {
    const parts = this.renderInlineChildren(node);
    if (parts.length > 0) {
      this.output.push(parts.join(''));
    }
  }

  /**
   * Render inline children (text, emphasis, code, links, etc.)
   */
  renderInlineChildren(node) {
    const parts = [];
    node.children?.forEach((child, idx) => {
      if (child.type === 'text') {
        parts.push(child.content);
      } else if (child.type === 'inline_code') {
        parts.push(`\`${child.content}\``);
      } else if (child.type === 'emphasis') {
        parts.push(child.content.toUpperCase());
      } else if (child.type === 'link') {
        parts.push(child.meta.href);
      }
    });

    // Join parts, adding spaces between elements but respecting existing spaces
    let result = '';
    parts.forEach((part, idx) => {
      if (idx > 0) {
        // Add space if previous part doesn't end with space and this part doesn't start with space
        if (!result.endsWith(' ') && !part.startsWith(' ')) {
          result += ' ';
        }
      }
      result += part;
    });

    return [result]; // Return as array to maintain compatibility with caller
  }

  /**
   * Serialize list
   */
  serializeList(node) {
    const isOrdered = node.meta?.ordered || false;
    const listDepth = node.depth;
    let itemCounter = 1;

    node.children?.forEach((child, idx) => {
      if (child.type === 'list_item') {
        this.serializeListItem(child, isOrdered, itemCounter, listDepth);
        itemCounter++;
      } else {
        this.serializeNode(child, 'list');
      }
    });
  }

  /**
   * Serialize list item
   */
  serializeListItem(node, isOrdered = false, itemNum = 1, listDepth = 0) {
    const itemDepth = node.depth;
    const indent = itemDepth > 0 ? '  '.repeat(itemDepth) : '';
    let bullet;

    // Top-level items (at same depth as list) use numbers or bullets
    if (itemDepth === listDepth) {
      bullet = isOrdered ? `${itemNum}. ` : '- ';
    } else {
      // Nested items use -- format
      bullet = '-- ';
    }

    const text = this.renderListItemText(node);
    this.output.push(`${indent}${bullet}${text}`);

    // Handle nested lists
    node.children?.forEach(child => {
      if (child.type === 'list') {
        this.serializeNode(child, 'list_item');
      }
    });
  }

  /**
   * Extract text from list item (excluding nested lists)
   */
  renderListItemText(node) {
    const parts = [];
    node.children?.forEach(child => {
      if (child.type === 'text') {
        parts.push(child.content);
      } else if (child.type === 'inline_code') {
        parts.push(`\`${child.content}\``);
      } else if (child.type === 'emphasis') {
        parts.push(child.content.toUpperCase());
      } else if (child.type === 'link') {
        parts.push(child.meta.href);
      } else if (child.type !== 'list') {
        // Recursively handle other inline elements
        this.serializeNode(child);
      }
    });
    return parts.join(' ');
  }

  /**
   * Serialize code block
   */
  serializeCodeBlock(node) {
    this.output.push('```');
    this.output.push(node.content.trim());
    this.output.push('```');
  }

  /**
   * Serialize inline code
   */
  serializeInlineCode(node) {
    return `\`${node.content}\``;
  }

  /**
   * Serialize blockquote
   */
  serializeBlockquote(node) {
    const text = node.children?.map(c => c.content).join(' ') || node.content;
    this.output.push(`"${text}"`);
  }

  /**
   * Serialize link
   */
  serializeLink(node) {
    return node.meta.href;
  }

  /**
   * Serialize emphasis (bold/italic)
   */
  serializeEmphasis(node) {
    return node.content.toUpperCase();
  }

  /**
   * Serialize callout
   */
  serializeCallout(node) {
    const { type } = node.meta;
    const normalizedType = this.normalizeCalloutType(type);
    this.output.push(`[${normalizedType}] ${node.content}`);
  }

  /**
   * Normalize callout type to standard format
   */
  normalizeCalloutType(type) {
    if (type === '>>') return 'KEY INSIGHT';
    if (type === '!!') return 'ACTION REQUIRED';
    return type.toUpperCase();
  }

  /**
   * Determine if spacing should be added between nodes
   */
  shouldAddSpacing(node, parentType) {
    if (!this.lastNodeType) return false;

    const blockElements = ['heading', 'paragraph', 'list', 'code_block', 'blockquote', 'callout'];
    const lastIsBlock = blockElements.includes(this.lastNodeType);
    const currentIsBlock = blockElements.includes(node.type);

    return lastIsBlock && currentIsBlock;
  }
}

