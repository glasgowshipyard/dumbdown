/**
 * Dumbdown Enhanced - Main JavaScript
 * Handles conversion of rich text to the Dumbdown format
 */

// Initialize when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', function() {
    // Set up event handlers
    setupPasteHandler();
    
    // Set up button event listeners
    const convertButton = document.getElementById("convert-button");
    if (convertButton) {
      convertButton.addEventListener("click", convertDumbdown);
    }
    
    const copyButton = document.getElementById("copy-button");
    if (copyButton) {
      copyButton.addEventListener("click", copyOutput);
    }
    
    console.log("Dumbdown editor initialized");
  });
  
  /**
   * Enhanced paste handler to capture rich content
   */
  function setupPasteHandler() {
    const inputDiv = document.getElementById("input");
    if (!inputDiv) return;
    
    inputDiv.addEventListener("paste", function(event) {
      event.preventDefault();
  
      const clipboardData = (event.clipboardData || window.clipboardData);
      
      // Try to get the richest format available
      let content;
      let format = 'plaintext';
      
      if (clipboardData.types.includes('text/html')) {
        content = clipboardData.getData('text/html');
        format = 'html';
        console.log("HTML content detected in clipboard");
      } else if (clipboardData.types.includes('text/plain')) {
        content = clipboardData.getData('text/plain');
        console.log("Plain text content detected in clipboard");
      } else {
        // Fallback, though this is rare
        content = '';
        console.log("No usable content detected in clipboard");
      }
  
      // Update the input with the pasted content
      if (format === 'html') {
        inputDiv.innerHTML = content;
      } else {
        document.execCommand('insertText', false, content);
      }
    });
  }
  
  /**
   * Detect if content is from a news article and preprocess accordingly
   */
  function preprocessNewsContent(html) {
    // Identify common news site patterns
    const isNewsArticle = /<article|class="article|news-story|story-body|headline|byline/.test(html);
    
    if (isNewsArticle) {
      console.log("News article detected, applying special processing");
      
      // Remove common news site clutter
      html = html
        // Remove social media sharing widgets
        .replace(/<div[^>]*?(social|share|follow)[^>]*?>[\s\S]*?<\/div>/gi, '')
        // Remove newsletter signup forms
        .replace(/<div[^>]*?(newsletter|subscribe)[^>]*?>[\s\S]*?<\/div>/gi, '')
        // Remove related stories sections
        .replace(/<div[^>]*?(related|more-stories|also-read)[^>]*?>[\s\S]*?<\/div>/gi, '');
    }
    
    return html;
  }
  
  /**
   * Main conversion function - triggered when convert button is clicked
   */
  function convertDumbdown() {
    const inputDiv = document.getElementById("input");
    if (!inputDiv) {
      console.error("Input element not found.");
      return;
    }
  
    let html = inputDiv.innerHTML.trim();
  
    if (!html) {
      console.warn("No text to process.");
      return;
    }
  
    // Detect and preprocess news content
    html = preprocessNewsContent(html);
  
    // Convert HTML to Dumbdown
    let text = convertHTMLToDumbdown(html);
  
    const outputDiv = document.getElementById("output");
    if (!outputDiv) {
      console.error("Output element not found.");
      return;
    }
  
    outputDiv.textContent = text;
    console.log("Conversion completed successfully");
  }
  
  /**
   * Enhanced HTML to Dumbdown conversion
   * Handles code blocks, headers, lists, and text formatting
   */
  function convertHTMLToDumbdown(html) {
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    console.log("Starting HTML conversion...");
    
    // Remove unnecessary elements that often cause whitespace issues
    tempDiv.querySelectorAll('script, style, meta').forEach(el => {
      el.remove();
    });
    
    // First, handle code blocks to prevent them from being affected by other formatting
    tempDiv.querySelectorAll('pre, code').forEach(el => {
      if (el.tagName === 'PRE') {
        // Multi-line code blocks
        const content = el.innerText.trim();
        console.log("Processing code block");
        // Replace with backticks format (escaped properly)
        el.outerHTML = `<div class="dumbdown-codeblock">\`\`\`\n${content}\n\`\`\`</div>`;
      } else if (el.tagName === 'CODE' && el.parentElement.tagName !== 'PRE') {
        // Inline code
        const content = el.innerText.trim();
        el.outerHTML = `<span class="dumbdown-inline-code">\`${content}\`</span>`;
      }
    });
  
    // Convert headers (only process once)
    tempDiv.querySelectorAll("h1, h2, h3").forEach(el => {
      const fullText = el.innerText.trim();
      console.log("Processing header: " + fullText);
      
      // For h1 and h2, create underlines
      if (el.tagName === "H1") {
        const underline = "=".repeat(Math.max(fullText.length, 3));
        el.outerHTML = `<div class="dumbdown-header">${fullText}\n${underline}</div>`;
      } else if (el.tagName === "H2") {
        const underline = "-".repeat(Math.max(fullText.length, 3));
        el.outerHTML = `<div class="dumbdown-header">${fullText}\n${underline}</div>`;
      }
    });
  
    // Process each ordered list separately to maintain proper numbering
    tempDiv.querySelectorAll('ol').forEach(list => {
      let counter = 1;
      list.querySelectorAll('> li').forEach(li => {
        // Store the original counter value for this item
        li.setAttribute('data-counter', counter++);
      });
    });
    
    // Process unordered lists with proper nesting
    tempDiv.querySelectorAll('ul li').forEach(li => {
      // Calculate nesting level
      let level = 0;
      let parent = li.parentElement;
      while (parent) {
        if (parent.tagName === 'UL' || parent.tagName === 'OL') level++;
        parent = parent.parentElement;
      }
      
      // Store level as data attribute for later processing
      li.setAttribute('data-level', level);
    });
    
    // Process ordered lists with proper numbering
    tempDiv.querySelectorAll('ol li').forEach(li => {
      // Calculate nesting level
      let level = 0;
      let parent = li.parentElement;
      while (parent) {
        if (parent.tagName === 'UL' || parent.tagName === 'OL') level++;
        parent = parent.parentElement;
      }
      
      // Store level as data attribute for later processing
      li.setAttribute('data-level', level);
    });
    
    // Now process all list items in document order
    tempDiv.querySelectorAll('li').forEach(li => {
      const level = parseInt(li.getAttribute('data-level') || "1");
      const isOrdered = li.parentElement.tagName === 'OL';
      const content = li.innerHTML.trim();
      
      // Calculate indentation
      const indent = '   '.repeat(Math.max(0, level - 1));
      
      // Determine the marker
      let marker;
      if (isOrdered) {
        // For ordered lists, use the stored counter
        const counter = li.getAttribute('data-counter') || "1";
        marker = `${counter}.`;
      } else {
        // For unordered lists, use dash(es)
        marker = level > 1 ? '--' : '-';
      }
      
      // Replace the content
      li.innerHTML = `${indent}${marker} ${content}`;
    });
  
    // Convert bold text to UPPERCASE
    tempDiv.querySelectorAll("b, strong").forEach(el => {
      const content = el.innerHTML.trim();
      el.outerHTML = content.toUpperCase();
    });
  
    // Convert italic text to UPPERCASE
    tempDiv.querySelectorAll("i, em").forEach(el => {
      const content = el.innerHTML.trim();
      el.outerHTML = content.toUpperCase();
    });
  
    // Convert links
    tempDiv.querySelectorAll("a").forEach(el => {
      const linkText = el.innerText.trim();
      const href = el.href || '#';
      el.outerHTML = `<span class="dumbdown-link">[${linkText}](${href})</span>`;
    });
  
    // Handle blockquotes properly
    tempDiv.querySelectorAll("blockquote").forEach(el => {
      const content = el.innerText.trim();
      // Split by lines and add quotes to each line
      const lines = content.split('\n');
      const quotedLines = lines.map(line => `"${line.trim()}"`).join('\n');
      el.outerHTML = `<div class="dumbdown-blockquote">${quotedLines}</div>`;
    });
  
    // Process special callouts in divs
    tempDiv.querySelectorAll("div").forEach(el => {
      const content = el.innerText.trim();
      
      // Check for Dumbdown callout patterns
      if (content.startsWith('[') && content.includes(']')) {
        // Label/context marker - keep as is
        el.outerHTML = content;
      } else if (content.startsWith('>>')) {
        // Insight callout - keep as is
        el.outerHTML = content;
      } else if (content.startsWith('!!')) {
        // Action required - keep as is
        el.outerHTML = content;
      }
    });
  
    // Get the result and clean up all the wrapper spans we added
    let result = tempDiv.innerText;
    
    // Normalize whitespace
    result = result
      // Remove excessive line breaks (more than 2)
      .replace(/\n{3,}/g, '\n\n')
      // Remove trailing spaces on lines
      .replace(/[ \t]+(\n|$)/gm, '$1')
      // Ensure code blocks have proper spacing
      .replace(/```\n/g, '```\n')
      .replace(/\n```/g, '\n```');
    
    console.log("Conversion complete!");
    
    return result;
  }
  
  /**
   * Detect input format based on content
   */
  function detectFormat(content) {
    if (/<\/?[a-z][\s\S]*>/i.test(content)) {
      return 'html';
    } else if (/^#|^-{3,}|^\*{3,}|^```|^\[.+\]:.+/m.test(content)) {
      return 'markdown';
    } else {
      return 'plaintext';
    }
  }
  
  /**
   * Clean up plain text to ensure it's formatted nicely
   */
  function cleanupPlainText(text) {
    return text
      // Remove excessive whitespace
      .replace(/[ \t]+/g, ' ')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      // Trim lines
      .split('\n').map(line => line.trim()).join('\n');
  }
  
  /**
   * Copy the output to clipboard
   */
  function copyOutput() {
    const outputText = document.getElementById("output").textContent;
    if (!outputText) {
      console.warn("Nothing to copy.");
      return;
    }
  
    navigator.clipboard.writeText(outputText).then(() => {
      alert("Copied to clipboard!");
    }).catch(err => {
      console.error("Error copying text: ", err);
    });
  }