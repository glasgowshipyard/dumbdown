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

    // Convert Lists (Fixed indentation)
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
        
        // Build the formatted content directly
        let formattedLine = '';
        
        if (nestLevel === 1) {
            // Top level items - NO indentation
            formattedLine = isOrdered ? `${itemIndex}. ` : "- ";
        } else {
            // Nested items - exactly 2 spaces before --
            formattedLine = "  -- ";
        }
        
        // Get just the direct text content
        let directContent = '';
        Array.from(li.childNodes).forEach(node => {
            if (node.nodeType === 3) { // Text node
            directContent += node.textContent;
            } else if (node.nodeType === 1 && node.tagName !== 'UL' && node.tagName !== 'OL') {
            directContent += node.textContent;
            }
        });
        
        // Create the final content
        formattedLine += directContent.trim();
        
        // Replace the element in the DOM
        const placeholder = document.createTextNode(formattedLine);
        
        // Handle nested lists
        const nestedLists = Array.from(li.querySelectorAll('ul, ol'));
        if (nestedLists.length > 0) {
            li.parentNode.insertBefore(placeholder, li);
            nestedLists.forEach(nestedList => {
            li.parentNode.insertBefore(nestedList, li);
            });
            li.remove();
        } else {
            li.outerHTML = formattedLine;
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

  // Normalize whitespace - reduce extra spacing
  let result = document.body.textContent
    .replace(/\n{2,}/g, "\n")  // Replace 2+ newlines with just 1
    .replace(/[ \t]+(\n|$)/gm, '$1')  // Remove trailing spaces
    .trim();

  console.log("Conversion complete!");
  return result;
}

// Start Server
app.listen(PORT, () => {
  console.log(`Dumbdown server running on port ${PORT}`);
});