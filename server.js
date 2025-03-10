const express = require('express');
const path = require('path');
const compression = require('compression');
const bodyParser = require('express').json;

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

  // Convert headers (h1 - h6)
  tempDiv.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(el => {
      let text = el.innerText.trim();
      let underline = "";
      if (el.tagName === "H1") underline = "=".repeat(text.length);
      if (el.tagName === "H2") underline = "-".repeat(text.length);
      el.outerHTML = underline ? `${text}\n${underline}` : text;
  });

  // Convert lists (handle proper indentation for nesting)
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

  // Convert bold and italics to UPPERCASE
  tempDiv.querySelectorAll("b, strong, i, em").forEach(el => {
      let text = el.innerText.trim();
      el.outerHTML = text.toUpperCase();
  });

  // Convert blockquotes
  tempDiv.querySelectorAll("blockquote").forEach(el => {
      let content = el.innerText.trim();
      el.outerHTML = `\n\n"${content}"\n\n`;
  });

  // Convert code blocks
  tempDiv.querySelectorAll("pre").forEach(el => {
      let content = el.innerText.trim();
      el.outerHTML = `\n\n\`\`\`\n${content}\n\`\`\`\n\n`;
  });

  // Convert inline code
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

  // Remove remaining HTML tags but keep formatting
  return tempDiv.innerText.replace(/\n{3,}/g, "\n\n").trim();
}

// Start Server
app.listen(PORT, () => {
  console.log(`Dumbdown server running on port ${PORT}`);
});
