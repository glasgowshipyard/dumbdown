/**
 * Dumbdown Enhanced - Main JavaScript
 * Handles conversion of rich text to the Dumbdown format with special handling for news articles
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
    
    // Final post-processing for extremely clean output
    text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');
  
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
   * Special processing for excessive whitespace
   */
  function convertHTMLToDumbdown(html) {
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    console.log("Starting HTML conversion...");
    
    // Remove unnecessary elements that often cause whitespace issues
    tempDiv.querySelectorAll('script, style, meta, .ad, .advertisement, [aria-hidden="true"], .hidden').forEach(el => {
      el.remove();
    });
    
    // Clean up image captions and timestamps
    tempDiv.querySelectorAll('figcaption, time, .timestamp, .caption, .metadata').forEach(el => {
      const content = el.innerText.trim();
      if (content) {
        el.innerHTML = content;
      }
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
      if (el.tagName === "H1" || el.tagName === "H2") {
        const underline = el.tagName === "H1" 
          ? "=".repeat(Math.max(fullText.length, 3)) 
          : "-".repeat(Math.max(fullText.length, 3));
          
        el.outerHTML = `<div class="dumbdown-header">${fullText}\n${underline}</div>`;
      }
      // For h3, just keep the text
    });
  
    // Convert bullet lists with proper nesting
    const processListItems = (listItems, listType) => {
      listItems.forEach(el => {
        // Determine nesting level
        let nestLevel = 0;
        let parent = el.parentElement;
        while (parent && (parent.tagName === 'UL' || parent.tagName === 'OL')) {
          nestLevel++;
          parent = parent.parentElement;
        }
        
        // Use appropriate bullet based on list type and nesting
        let marker = '';
        if (listType === 'UL') {
          marker = nestLevel > 1 ? '--' : '-';
        } else {
          marker = '1.'; // For now, all ordered items use "1."
        }
        
        // Add spacing based on nesting level
        const indentation = '  '.repeat(Math.max(0, nestLevel - 1));
        el.innerHTML = `${indentation}${marker} ${el.innerHTML.trim()}`;
      });
    };
    
    console.log("Processing lists...");
    
    // Process unordered lists
    processListItems(tempDiv.querySelectorAll("ul > li"), 'UL');
    
    // Process ordered lists
    processListItems(tempDiv.querySelectorAll("ol > li"), 'OL');
  
    // Convert bold/italics
    console.log("Processing text formatting...");
    
    tempDiv.querySelectorAll("b, strong").forEach(el => {
      const content = el.innerHTML;
      el.outerHTML = `<span class="dumbdown-bold">**${content}**</span>`;
    });
  
    tempDiv.querySelectorAll("i, em").forEach(el => {
      const content = el.innerHTML;
      el.outerHTML = `<span class="dumbdown-italic">_${content}_</span>`;
    });
  
    // Convert links
    tempDiv.querySelectorAll("a").forEach(el => {
      const linkText = el.innerText.trim();
      const href = el.href || '#';
      el.outerHTML = `<span class="dumbdown-link">[${linkText}](${href})</span>`;
    });
  
    // Handle blockquotes
    tempDiv.querySelectorAll("blockquote").forEach(el => {
      const content = el.innerHTML.trim();
      const lines = content.split('\n').map(line => `"${line.trim()}"`).join('\n');
      el.outerHTML = `<div class="dumbdown-blockquote">${lines}</div>`;
    });
  
    // Get the result and clean up all the wrapper spans we added
    let result = tempDiv.innerText;
    
    console.log("Normalizing whitespace...");
    
    // Enhanced whitespace normalization specifically for news articles
    result = result
      // Handle paragraph breaks with consistent spacing
      .replace(/\n{3,}/g, '\n\n')
      // Remove trailing spaces
      .replace(/[ \t]+(\n|$)/gm, '$1')
      // Remove leading spaces on each line (often from indentation)
      .replace(/^[ \t]+/gm, '')
      // Fix time stamps and bylines that often get isolated
      .replace(/^(\d{1,2}:\d{2})$/gm, '[$1]')
      // Join single words on their own line (often author names or timestamps)
      .replace(/^([A-Za-z]+)(\n{2})/gm, '$1 ')
      // Fix issues with numbered lists getting broken
      .replace(/^(\d+)\.\s*\n+/gm, '$1. ')
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