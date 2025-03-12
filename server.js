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

  // Convert headers (h1 - h6)
  document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(el => {
      let text = el.textContent.trim();
      let underline = "";
      if (el.tagName === "H1") underline = "=".repeat(text.length);
      if (el.tagName === "H2") underline = "-".repeat(text.length);
      el.outerHTML = underline ? `${text}\n${underline}` : text;
  });

  // Convert lists (handle indentation for nested lists properly)
  document.querySelectorAll("ul, ol").forEach(list => {
      let isOrdered = list.tagName === "OL";
      let itemIndex = 1;
      list.querySelectorAll("li").forEach(li => {
          let nestLevel = 0;
          let parent = li.parentElement;
          while (parent && (parent.tagName === "UL" || parent.tagName === "OL")) {
              nestLevel++;
              parent = parent.parentElement;
          }
          let marker = isOrdered ? `${itemIndex}.` : "-";
          let indentation = "  ".repeat(nestLevel - 1) + (nestLevel > 0 ? "-- " : "");
          li.outerHTML = `${indentation}${marker} ${li.textContent.trim()}`;
          if (isOrdered && nestLevel === 0) itemIndex++;
      });
  });

  // Convert bold and italics to UPPERCASE (instead of Markdown)
  document.querySelectorAll("b, strong, i, em").forEach(el => {
      let text = el.textContent.trim().toUpperCase();
      el.outerHTML = text;
  });

  // Convert blockquotes
  document.querySelectorAll("blockquote").forEach(el => {
      let content = el.textContent.trim();
      el.outerHTML = `\n\n"${content}"\n\n`;
  });

  // Convert code blocks
  document.querySelectorAll("pre").forEach(el => {
      let content = el.textContent.trim();
      el.outerHTML = `\n\n\`\`\`\n${content}\n\`\`\`\n\n`;
  });

  // Convert inline code
  document.querySelectorAll("code").forEach(el => {
      let content = el.textContent.trim();
      el.outerHTML = "`" + content + "`";
  });

  // Convert links (just extract the URL instead of Markdown format)
  document.querySelectorAll("a").forEach(el => {
      let href = el.href || "#";
      el.outerHTML = href;
  });

  // Handle callouts
  document.querySelectorAll("div").forEach(el => {
      let text = el.textContent.trim();
      if (/^\[WARNING\]/i.test(text)) {
          el.outerHTML = `\n\n[WARNING] ${text.replace(/^\[WARNING\]\s*/i, '')}\n\n`;
      } else if (/^\[NOTE\]/i.test(text)) {
          el.outerHTML = `\n\n[NOTE] ${text.replace(/^\[NOTE\]\s*/i, '')}\n\n`;
      } else if (/^>>/i.test(text)) {
          el.outerHTML = `\n\n>> ${text.replace(/^>>\s*/, '')}\n\n`;
      } else if (/^!!/i.test(text)) {
          el.outerHTML = `\n\n!! ${text.replace(/^!!\s*/, '')}\n\n`;
      }
  });

  // Remove remaining HTML tags but keep formatting
  return document.body.textContent.replace(/\n{3,}/g, "\n\n").trim();
}

// Start Server
app.listen(PORT, () => {
  console.log(`Dumbdown server running on port ${PORT}`);
});