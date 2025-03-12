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

  console.log("Received conversion request");
  console.log("Original HTML:", req.body.text);

  const convertedText = convertToDumbdown(req.body.text);
  res.json({ dumbdown: convertedText });
});

// Conversion Logic
function convertToDumbdown(html) {
  console.log("Starting conversion process...");
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Convert Headers (h1 - h6)
  console.log("Converting headers...");
  document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(el => {
      let text = el.textContent.trim();
      let underline = "";
      if (el.tagName === "H1") underline = "=".repeat(text.length);
      if (el.tagName === "H2") underline = "-".repeat(text.length);
      el.outerHTML = underline ? `${text}\n${underline}` : text;
  });

  // Convert Lists (Fixing Nesting & Numbering) - Bottom-up approach
  console.log("Converting lists...");
  
  function getDepth(element) {
      let depth = 0;
      while (element.parentElement && (element.parentElement.tagName === "UL" || element.parentElement.tagName === "OL")) {
          depth++;
          element = element.parentElement;
      }
      return depth;
  }

  let allListItems = Array.from(document.querySelectorAll("li"));
  allListItems.sort((a, b) => getDepth(b) - getDepth(a)); // Process from deepest level first

  allListItems.forEach(li => {
      let nestLevel = getDepth(li);
      let isOrdered = li.parentElement.tagName === "OL";
      let marker = isOrdered ? "1." : "-";
      
      let prefix = "";
      if (nestLevel > 1) {
          prefix = "  ".repeat(nestLevel - 1) + "-- ";
      }
      
      console.log(`List item: ${li.textContent.trim()} (Nest level: ${nestLevel}, Prefix: "${prefix}", Marker: "${marker}")`);
      
      const content = li.textContent.trim();
      li.outerHTML = `\n${prefix}${marker} ${content}`;
  });

  // Convert Bold and Italics to Uppercase
  console.log("Converting bold and italics...");
  document.querySelectorAll("b, strong, i, em").forEach(el => {
      let text = el.textContent.trim().toUpperCase();
      console.log(`Converting text to uppercase: ${text}`);
      el.outerHTML = text;
  });

  // Convert Blockquotes
  console.log("Converting blockquotes...");
  document.querySelectorAll("blockquote").forEach(el => {
      let content = el.textContent.trim();
      console.log(`Blockquote: ${content}`);
      el.outerHTML = `\n\n"${content}"\n\n`;
  });

  // Convert Code Blocks
  console.log("Converting code blocks...");
  document.querySelectorAll("pre").forEach(el => {
      let content = el.textContent.trim();
      console.log(`Code block detected: ${content}`);
      el.outerHTML = `\n\n\`\`\`\n${content}\n\`\`\`\n\n`;
  });

  // Convert Inline Code
  console.log("Converting inline code...");
  document.querySelectorAll("code").forEach(el => {
      let content = el.textContent.trim();
      console.log(`Inline code detected: ${content}`);
      el.outerHTML = "`" + content + "`";
  });

  // Convert Links to Plain URLs
  console.log("Converting links...");
  document.querySelectorAll("a").forEach(el => {
      let href = el.href || "#";
      console.log(`Extracting link: ${href}`);
      el.outerHTML = href;
  });

  // Convert Callouts
  console.log("Converting callouts...");
  document.querySelectorAll("div").forEach(el => {
      let text = el.textContent.trim();
      if (/^\[WARNING\]/i.test(text)) {
          console.log(`Warning detected: ${text}`);
          el.outerHTML = `\n\n[WARNING] ${text.replace(/^\[WARNING\]\s*/i, '')}\n\n`;
      } else if (/^\[NOTE\]/i.test(text)) {
          console.log(`Note detected: ${text}`);
          el.outerHTML = `\n\n[NOTE] ${text.replace(/^\[NOTE\]\s*/i, '')}\n\n`;
      } else if (/^>>/i.test(text)) {
          console.log(`Insight detected: ${text}`);
          el.outerHTML = `\n\n>> ${text.replace(/^>>\s*/, '')}\n\n`;
      } else if (/^!!/i.test(text)) {
          console.log(`Action required detected: ${text}`);
          el.outerHTML = `\n\n!! ${text.replace(/^!!\s*/, '')}\n\n`;
      }
  });

  console.log("Conversion complete.");

  // Remove remaining HTML tags but keep formatting
  let result = document.body.textContent.replace(/\n{3,}/g, "\n\n").trim();
  console.log("Final Output:", result);
  return result;
}

// Start Server
app.listen(PORT, () => {
  console.log(`Dumbdown server running on port ${PORT}`);
});