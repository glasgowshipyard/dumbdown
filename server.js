const express = require('express');
const path = require('path');
const compression = require('compression');
const bodyParser = require('express.json');

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
  let tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Convert headers (h1 - h3 only, deeper headers ignored for now)
  tempDiv.querySelectorAll("h1, h2, h3").forEach(el => {
      let text = el.innerText.trim();
      let underline = "";
      if (el.tagName === "H1") underline = "=".repeat(text.length);
      if (el.tagName === "H2") underline = "-".repeat(text.length);
      if (el.tagName === "H3") underline = ""; // No underline for h3
      el.outerHTML = `${text}\n${underline}`;
  });

  // Convert lists (handle nesting)
  tempDiv.querySelectorAll("ul, ol").forEach(list => {
      let isOrdered = list.tagName === "OL";
      list.querySelectorAll("li").forEach(li => {
          let nestLevel = 0;
          let parent = li.parentElement;
          while (parent && (parent.tagName === "UL" || parent.tagName === "OL")) {
              nestLevel++;
              parent = parent.parentElement;
          }
          let marker = isOrdered ? "1." : "-";
          let indentation = "  ".repeat(nestLevel - 1);
          li.outerHTML = `${indentation}${marker} ${li.innerText.trim()}`;
      });
  });

  // Convert inline formatting
  tempDiv.innerHTML = tempDiv.innerHTML.replace(/<b>(.*?)<\/b>/gi, (_, text) => text.toUpperCase());
  tempDiv.innerHTML = tempDiv.innerHTML.replace(/<i>(.*?)<\/i>/gi, (_, text) => `_${text}_`);

  // Convert blockquotes
  tempDiv.querySelectorAll("blockquote").forEach(el => {
      let content = el.innerText.trim();
      el.outerHTML = `"${content}"`;
  });

  // Convert code blocks
  tempDiv.querySelectorAll("pre").forEach(el => {
      let content = el.innerText.trim();
      el.outerHTML = `\n\n\`\`\`\n${content}\n\`\`\`\n\n`;
  });
  
  tempDiv.querySelectorAll("code").forEach(el => {
      let content = el.innerText.trim();
      el.outerHTML = "`" + content + "`";
  });

  // Convert links
  tempDiv.querySelectorAll("a").forEach(el => {
      let linkText = el.innerText.trim();
      let href = el.href || "#";
      el.outerHTML = `[${linkText}](${href})`;
  });

  // Remove remaining HTML tags
  return tempDiv.innerText.trim();
}

// Start Server
app.listen(PORT, () => {
  console.log(`Dumbdown server running on port ${PORT}`);
});
