/**************************************
 * DUMBDOWN ENHANCED
 * HTML to Dumbdown Converter
 **************************************/

// =============================================================
// EVENT HANDLERS AND INITIALIZATION
// =============================================================

/**
 * Initialize the app when the window loads
 */
window.addEventListener('DOMContentLoaded', function() {
    // Set up event handlers
    setupPasteHandler();
    
    // Set up convert and copy buttons
    document.getElementById("convert-button").addEventListener("click", convertDumbdown);
    document.getElementById("copy-button").addEventListener("click", copyOutput);
  });
  
  /**
   * Set up enhanced paste handler to capture rich content
   */
  function setupPasteHandler() {
    document.getElementById("input").addEventListener("paste", function(event) {
      event.preventDefault();
  
      const clipboardData = (event.clipboardData || window.clipboardData);
      
      // Try to get the richest format available
      let content;
      let format = 'plaintext';
      
      if (clipboardData.types.includes('text/html')) {
        content = clipboardData.getData('text/html');
        format = 'html';
        console.log("HTML content detected");
      } else if (clipboardData.types.includes('text/plain')) {
        content = clipboardData.getData('text/plain');
        console.log("Plain text content detected");
      } else {
        // Fallback, though this is rare
        content = '';
        console.log("No usable content detected");
      }
  
      // Update the input with the pasted content
      let inputDiv = document.getElementById("input");
      if (format === 'html') {
        inputDiv.innerHTML = content;
      } else {
        document.execCommand('insertText', false, content);
      }
    });
  }
  
  /**
   * Main conversion function - triggered by the Convert button
   */
  function convertDumbdown() {
    let inputDiv = document.getElementById("input");
    if (!inputDiv) {
      console.error("Input element not found.");
      return;
    }
  
    let html = inputDiv.innerHTML.trim(); // Preserve raw pasted content
  
    if (!html) {
      console.warn("No text to process.");
      return;
    }
  
    // Convert HTML to Dumbdown
    let text = convertHTMLToDumbdown(html);
  
    let outputDiv = document.getElementById("output");
    if (!outputDiv) {
      console.error("Output element not found.");
      return;
    }
  
    outputDiv.textContent = text; // Display the Dumbdown result
  }
  
  /**
   * Copy the output to clipboard
   */
  function copyOutput() {
    let outputText = document.getElementById("output").textContent;
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
  
  // =============================================================
  // CORE CONVERSION FUNCTIONS
  // =============================================================
  
  /**
   * Enhanced HTML to Dumbdown conversion function
   * Fixes issues with header processing, improves code block handling,
   * and normalizes whitespace
   */
  function convertHTMLToDumbdown(html) {
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    console.log("Starting HTML conversion...");
    
    // First, handle code blocks to prevent them from being affected by other formatting
    tempDiv.querySelectorAll('pre, code').forEach(el => {
      if (el.tagName === 'PRE') {
        // Multi-line code blocks
        const content = el.innerText.trim();
        console.log("Processing code block:", content.substring(0, 30) + "...");
        // Replace with backticks format
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
      console.log("Processing header:", fullText);
      
      // For h1 and h2, create underlines
      if (el.tagName === "H1" || el.tagName === "H2") {
        const underline = el.tagName === "H1" 
          ? "=".repeat(Math.max(fullText.length, 3)) 
          : "-".repeat(Math.max(fullText.length, 3));
          
        el.outerHTML = `<div class="dumbdown-header">${fullText}\n${underline}</div>`;
      }
      // For h3, just keep the text (or implement another format if preferred)
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
    
    // Normalize whitespace
    result = result
      // Handle paragraph breaks with consistent spacing
      .replace(/\n{3,}/g, '\n\n')
      // Remove trailing spaces
      .replace(/[ \t]+(\n|$)/gm, '$1')
      // Ensure code blocks have proper spacing
      .replace(/```\n/g, '```\n')
      .replace(/\n```/g, '\n```');
    
    console.log("Conversion complete!");
    
    return result;
  }
  
  /**
   * Detect input format based on content
   * Currently supports HTML and plaintext detection
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

  // Get a reference to the button
    const convertButton = document.getElementById("convert-button") || document.querySelector("button");

// Attach the event listener
    if (convertButton) {
    convertButton.addEventListener("click", convertDumbdown);
    }   
    