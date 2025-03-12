const express = require('express');
const path = require('path');
const compression = require('compression');
const bodyParser = require('express').json;
const { JSDOM } = require('jsdom');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Dumbdown Conversion API
app.post('/convert', (req, res) => {
  if (!req.body.text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const convertedText = convertToDumbdown(req.body.text);
  res.json({ dumbdown: convertedText });
});

// Conversion Logic
function convertToDumbdown(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  console.log("Starting conversion process...");

  // Remove unnecessary elements that often cause whitespace issues
  document.querySelectorAll('script, style, meta').forEach(el => {
    el.remove();
  });

  // Convert headers (h1 - h6)
  console.log("Converting headers...");
  document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(el => {
    let text = el.textContent.trim();
    let underline = "";
    if (el.tagName === "H1") underline = "=".repeat(text.length);
    if (el.tagName === "H2") underline = "-".repeat(text.length);
    el.outerHTML = underline ? `${text}\n${underline}` : text;
  });

  // Convert Lists (Improved handling with depth-first processing)
  console.log("Converting lists...");
  
  // Process lists from the deepest level first
  const allLists = Array.from(document.querySelectorAll("ul, ol"));
  const listsByDepth = {};

  // Group lists by their nesting depth
  allLists.forEach(list => {
    let depth = 0;
    let parent = list.parentElement;
    while (parent) {
      if (parent.tagName === 'UL' || parent.tagName === 'OL') depth++;
      parent = parent.parentElement;
    }
    
    if (!listsByDepth[depth]) listsByDepth[depth] = [];
    listsByDepth[depth].push(list);
    console.log(`Found ${list.tagName} at depth ${depth} with ${list.children.length} items`);
  });

  // Process from deepest to shallowest
  const depths = Object.keys(listsByDepth).sort((a, b) => b - a);
  depths.forEach(depth => {
    listsByDepth[depth].forEach(list => {
      const isOrdered = list.tagName === 'OL';
      let itemIndex = 1;
      
      // Process direct children only
      const items = Array.from(list.children).filter(el => el.tagName === 'LI');
      
      items.forEach(li => {
        // Calculate true nesting level
        let nestLevel = parseInt(depth) + 1;
        
        // Fixed marker logic - only apply marker for top-level items
        let marker = "";
        if (nestLevel === 1) {
          // Top level items get a marker
          marker = isOrdered ? `${itemIndex}.` : "-";
        }
        
        // Fixed indentation logic - no marker for nested items, just prefix
        let prefix = "";
        if (nestLevel > 1) {
          prefix = "  ".repeat(nestLevel - 1) + "--";
        }
        
        console.log(`List item: ${li.textContent.trim()} (Nest level: ${nestLevel}, Prefix: "${prefix}", Marker: "${marker}")`);
        
        // Get just the direct text content of this li, not including nested lists
        let directContent = '';
        Array.from(li.childNodes).forEach(node => {
          if (node.nodeType === 3) { // Text node
            directContent += node.textContent;
          } else if (node.nodeType === 1 && node.tagName !== 'UL' && node.tagName !== 'OL') {
            directContent += node.textContent;
          }
        });
        
        // Replace this li with formatted content - no leading newline to reduce spacing
        const newContent = `${prefix}${marker ? " " + marker : ""} ${directContent.trim()}`;
        
        // Keep nested lists intact by moving them after this item
        const nestedLists = Array.from(li.querySelectorAll('ul, ol'));
        if (nestedLists.length > 0) {
          const placeholder = document.createTextNode(newContent);
          li.parentNode.insertBefore(placeholder, li);
          nestedLists.forEach(nestedList => {
            li.parentNode.insertBefore(nestedList, li);
          });
          li.remove();
        } else {
          li.outerHTML = newContent;
        }
        
        if (isOrdered && nestLevel === 1) itemIndex++;
      });
    });
  });

  // Convert bold and italics to UPPERCASE
  console.log("Converting text formatting...");
  document.querySelectorAll("b, strong, i, em").forEach(el => {
    let text = el.textContent.trim().toUpperCase();
    el.outerHTML = text;
  });

  // Convert blockquotes
  console.log("Converting blockquotes...");
  document.querySelectorAll("blockquote").forEach(el => {
    let content = el.textContent.trim();
    el.outerHTML = `"${content}"`;
  });

  // Convert code blocks
  console.log("Converting code blocks...");
  document.querySelectorAll("pre").forEach(el => {
    let content = el.textContent.trim();
    el.outerHTML = `\`\`\`\n${content}\n\`\`\``;
  });

  // Convert inline code
  document.querySelectorAll("code").forEach(el => {
    // Skip if already inside a pre element
    if (el.parentElement.tagName !== 'PRE') {
      let content = el.textContent.trim();
      el.outerHTML = "`" + content + "`";
    }
  });

  // Convert links - just extract the URL
  console.log("Converting links...");
  document.querySelectorAll("a").forEach(el => {
    let href = el.href || "#";
    el.outerHTML = href;
  });

  // Handle callouts - reduce spacing around them
  console.log("Converting callouts...");
  document.querySelectorAll("div").forEach(el => {
    let text = el.textContent.trim();
    if (/^\[WARNING\]/i.test(text)) {
      el.outerHTML = `[WARNING] ${text.replace(/^\[WARNING\]\s*/i, '')}`;
    } else if (/^\[NOTE\]/i.test(text)) {
      el.outerHTML = `[NOTE] ${text.replace(/^\[NOTE\]\s*/i, '')}`;
    } else if (/^>>/i.test(text)) {
      el.outerHTML = `>> ${text.replace(/^>>\s*/, '')}`;
    } else if (/^!!/i.test(text)) {
      el.outerHTML = `!! ${text.replace(/^!!\s*/, '')}`;
    }
  });

   // WITH THIS NEW INTELLIGENT SPACING LOGIC:
  // Track previous element type for spacing
  let prevElementType = null;
  let processedContent = '';
  let lines = document.body.textContent.trim().split('\n');

  lines.forEach((line, index) => {
    // Skip empty lines
    if (!line.trim()) return;
    
    // Determine current element type
    let currentType = 'text'; // Default
    
    if (line.match(/^[=]+$/)) {
      currentType = 'h1-underline';
    } else if (line.match(/^[-]+$/)) {
      currentType = 'h2-underline';
    } else if (line.match(/^-\s/)) {
      currentType = 'ul';
    } else if (line.match(/^\s+--\s/)) {
      currentType = 'ul-nested';
    } else if (line.match(/^\d+\.\s/)) {
      currentType = 'ol';
    } else if (line.match(/^```/)) {
      currentType = 'code';
    } else if (line.match(/^"/)) {
      currentType = 'blockquote';
    } else if (line.match(/^\[/)) {
      currentType = 'callout';
    } else if (line.match(/^>>/)) {
      currentType = 'insight';
    } else if (line.match(/^!!/)) {
      currentType = 'action';
    }
    
    // Determine if we need a line break
    let needsBreak = false;
    
    // Always add break after header underlines
    if (prevElementType === 'h1-underline' || prevElementType === 'h2-underline') {
      needsBreak = true;
    }
    // Add break between different content types (but not between nested list items and their parents)
    else if (prevElementType && 
            prevElementType !== currentType && 
            !(prevElementType === 'ul' && currentType === 'ul-nested') &&
            !(prevElementType === 'ol' && currentType === 'ul-nested')) {
      needsBreak = true;
    }
    
    // Add the line with appropriate spacing
    if (needsBreak && processedContent) {
      processedContent += '\n\n';
    } else if (processedContent) {
      processedContent += '\n';
    }
    
    processedContent += line;
    prevElementType = currentType;
  });

  let result = processedContent;

  console.log("Conversion complete!");
  return result;
}

// Start Server
app.listen(PORT, () => {
  console.log(`Dumbdown server running on port ${PORT}`);
});