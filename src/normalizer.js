/**
 * Whitespace Normalizer
 * Cleans up the semantic tree to remove excessive whitespace and normalize structure
 * This happens BEFORE serialization to ensure proper spacing
 */

export class Normalizer {
  /**
   * Normalize the semantic tree
   */
  normalize(semanticTree) {
    this.normalizeNode(semanticTree);
    this.removeEmptyNodes(semanticTree);
    return semanticTree;
  }

  /**
   * Recursively normalize nodes
   */
  normalizeNode(node) {
    if (!node.children) return;

    // Normalize content
    if (node.type === 'text') {
      // Clean up multiple spaces, preserve intentional line breaks for code
      node.content = node.content
        .replace(/\s+/g, ' ') // Collapse multiple whitespace to single space
        .trim();
    }

    // Process children
    for (let i = 0; i < node.children.length; i++) {
      this.normalizeNode(node.children[i]);
    }

    // Filter out empty nodes after normalization
    node.children = node.children.filter(child => !this.isEmpty(child));

    // Collapse consecutive text nodes
    this.collapseTextNodes(node);
  }

  /**
   * Check if a node is empty
   */
  isEmpty(node) {
    if (node.type === 'text') {
      return !node.content || !node.content.trim();
    }

    // These node types don't have children but have content
    const leafNodeTypes = ['heading', 'code_block', 'blockquote', 'emphasis', 'link', 'inline_code', 'callout'];
    if (leafNodeTypes.includes(node.type)) {
      return false; // Keep these even if they have no children
    }

    if (!node.children || node.children.length === 0) {
      return true;
    }

    return false;
  }

  /**
   * Merge consecutive text nodes
   */
  collapseTextNodes(node) {
    if (!node.children) return;

    const collapsed = [];
    for (const child of node.children) {
      if (child.type === 'text' && collapsed.length > 0 && collapsed[collapsed.length - 1].type === 'text') {
        // Merge with previous text node
        collapsed[collapsed.length - 1].content += ' ' + child.content;
      } else {
        collapsed.push(child);
      }
    }
    node.children = collapsed;
  }

  /**
   * Remove empty nodes recursively
   */
  removeEmptyNodes(node) {
    if (!node.children) return;

    for (const child of node.children) {
      this.removeEmptyNodes(child);
    }

    node.children = node.children.filter(child => {
      if (child.type === 'paragraph' || child.type === 'list' || child.type === 'list_item') {
        return child.children && child.children.length > 0;
      }
      return true;
    });
  }
}

