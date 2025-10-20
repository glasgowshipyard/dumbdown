/**
 * HTML Semantic Parser
 * Converts HTML into an intermediate semantic structure that's easier to normalize and serialize
 */

import { JSDOM } from 'jsdom';

class SemanticNode {
  constructor(type, content = '', depth = 0, meta = {}) {
    this.type = type; // 'text', 'heading', 'paragraph', 'list', 'list_item', 'code_block', 'inline_code', 'emphasis', 'link', 'blockquote', 'emphasis_marker'
    this.content = content;
    this.depth = depth; // nesting level
    this.children = [];
    this.meta = meta; // Additional metadata like href, level, etc.
  }

  addChild(child) {
    this.children.push(child);
  }
}

class HTMLParser {
  constructor(html) {
    const dom = new JSDOM(html);
    this.document = dom.window.document;
    this.root = new SemanticNode('root');
  }

  /**
   * Parse HTML and build semantic tree
   */
  parse() {
    this.removeUnnecessaryElements();
    this.parseNode(this.document.body, this.root, 0);
    return this.root;
  }

  /**
   * Remove elements that don't contribute semantic meaning
   */
  removeUnnecessaryElements() {
    ['script', 'style', 'meta', 'noscript', 'iframe'].forEach(selector => {
      this.document.querySelectorAll(selector).forEach(el => el.remove());
    });
  }

  /**
   * Recursively parse DOM nodes
   */
  parseNode(domNode, parentNode, depth, parentNodeType = null) {
    if (domNode.nodeType === 3) {
      // Text node - normalize whitespace but preserve meaningful spaces
      let text = domNode.textContent;

      // Replace multiple whitespace with single space, but keep the text
      text = text.replace(/\s+/g, ' ');

      // Only skip if it's purely whitespace
      if (text.trim()) {
        parentNode.addChild(new SemanticNode('text', text, depth));
      }
      return;
    }

    if (domNode.nodeType !== 1) return; // Skip non-element nodes

    const tag = domNode.tagName.toLowerCase();

    // Block-level elements
    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
      const level = parseInt(tag[1]);
      const text = this.extractText(domNode);
      parentNode.addChild(new SemanticNode('heading', text, depth, { level }));
      return;
    }

    if (tag === 'p') {
      const pNode = new SemanticNode('paragraph', '', depth);
      this.parseChildren(domNode, pNode, depth);
      parentNode.addChild(pNode);
      return;
    }

    if (tag === 'ul') {
      // If list is inside a list_item, it's nested - increment depth
      const listDepth = parentNodeType === 'list_item' ? depth : depth;
      const itemDepth = parentNodeType === 'list_item' ? depth + 1 : depth;
      const listNode = new SemanticNode('list', '', listDepth, { ordered: false });
      this.parseListItems(domNode, listNode, itemDepth);
      parentNode.addChild(listNode);
      return;
    }

    if (tag === 'ol') {
      // If list is inside a list_item, it's nested - increment depth
      const listDepth = parentNodeType === 'list_item' ? depth : depth;
      const itemDepth = parentNodeType === 'list_item' ? depth + 1 : depth;
      const listNode = new SemanticNode('list', '', listDepth, { ordered: true });
      this.parseListItems(domNode, listNode, itemDepth);
      parentNode.addChild(listNode);
      return;
    }

    if (tag === 'li') {
      const itemNode = new SemanticNode('list_item', '', depth);
      this.parseChildren(domNode, itemNode, depth);
      parentNode.addChild(itemNode);
      return;
    }

    if (tag === 'pre') {
      const text = domNode.textContent;
      parentNode.addChild(new SemanticNode('code_block', text, depth));
      return;
    }

    if (tag === 'code' && domNode.parentElement.tagName.toLowerCase() !== 'pre') {
      const text = domNode.textContent;
      parentNode.addChild(new SemanticNode('inline_code', text, depth));
      return;
    }

    if (tag === 'blockquote') {
      const quoteNode = new SemanticNode('blockquote', '', depth);
      this.parseChildren(domNode, quoteNode, depth);
      parentNode.addChild(quoteNode);
      return;
    }

    if (tag === 'a') {
      const href = domNode.getAttribute('href') || '#';
      const text = this.extractText(domNode);
      parentNode.addChild(new SemanticNode('link', text, depth, { href }));
      return;
    }

    if (tag === 'b' || tag === 'strong') {
      const text = this.extractText(domNode);
      parentNode.addChild(new SemanticNode('emphasis', text, depth, { type: 'strong' }));
      return;
    }

    if (tag === 'i' || tag === 'em') {
      const text = this.extractText(domNode);
      parentNode.addChild(new SemanticNode('emphasis', text, depth, { type: 'em' }));
      return;
    }

    // Handle div/section/article - could contain callouts
    if (tag === 'div' || tag === 'section' || tag === 'article') {
      const text = domNode.textContent.trim();
      const calloutMatch = text.match(/^\[?(WARNING|NOTE|ERROR)\]?\s*(.+)/i) ||
                          text.match(/^(>>|!!)\s*(.+)/);

      if (calloutMatch) {
        const calloutType = calloutMatch[1];
        const calloutText = calloutMatch[2] || text;
        parentNode.addChild(new SemanticNode('callout', calloutText, depth, { type: calloutType }));
        return;
      }

      // Regular div/section - parse children
      this.parseChildren(domNode, parentNode, depth);
      return;
    }

    // For other elements, parse children
    this.parseChildren(domNode, parentNode, depth);
  }

  /**
   * Parse list items preserving nesting
   */
  parseListItems(ulElement, listNode, depth) {
    Array.from(ulElement.children).forEach(child => {
      if (child.tagName.toLowerCase() === 'li') {
        this.parseNode(child, listNode, depth, 'list');
      }
    });
  }

  /**
   * Parse child nodes
   */
  parseChildren(domNode, parentNode, depth) {
    Array.from(domNode.childNodes).forEach(child => {
      this.parseNode(child, parentNode, depth, parentNode.type);
    });
  }

  /**
   * Extract all text content from a node
   */
  extractText(domNode) {
    return domNode.textContent.trim();
  }
}

export { HTMLParser, SemanticNode };
