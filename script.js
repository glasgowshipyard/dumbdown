/* Dumbdown Converter v0.1.8 - Modified by ChatGPT */

document.getElementById("input").addEventListener("paste", function(event) {
    event.preventDefault();
    let clipboardData = (event.clipboardData || window.clipboardData);
    let html = clipboardData.getData("text/html");
    if (html) {
        event.target.innerHTML = html;
    } else {
        event.target.innerText = clipboardData.getData("text/plain");
    }
});

function convertHTMLToDumbdown(html) {
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Remove all images
    tempDiv.querySelectorAll("img").forEach(el => el.remove());

    // Flatten all divs: replace them with their inner HTML to remove extra nesting
    tempDiv.querySelectorAll("div").forEach(el => {
        el.outerHTML = el.innerHTML;
    });

    // Headers: underlined formatting for h1-h6
    Array.from(tempDiv.getElementsByTagName('*'))
        .filter(el => /^h[1-6]$/i.test(el.tagName))
        .forEach(el => {
            let text = el.textContent.trim();
            let underline = el.tagName.toUpperCase() === "H1" ? "=".repeat(text.length) : "-".repeat(text.length);
            el.outerHTML = `${text}\n${underline}\n\n`;
        });

    // Lists: Process only top-level lists
    tempDiv.querySelectorAll("ul, ol").forEach(list => {
        try {
            if (!list.parentElement?.closest("ul, ol")) {
                let listOutput = processListItems(list);
                list.outerHTML = listOutput + "\n\n";
            }
        } catch (e) {
            console.warn("List processing error:", e);
        }
    });

    // Blockquotes: wrap text in quotes
    tempDiv.querySelectorAll("blockquote").forEach(el => {
        el.outerHTML = `"${el.textContent.trim()}"\n\n`;
    });

    // Code blocks: preserve formatting with fenced code blocks
    tempDiv.querySelectorAll("pre code").forEach(el => {
        let code = el.innerHTML
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .trim();
        el.outerHTML = `\n\n\`\`\`\n${code}\n\`\`\`\n\n`;
    });

    // Emphasis: Convert strong, b, em, and i tags to uppercase
    tempDiv.querySelectorAll("strong, b, em, i").forEach(el => {
        el.outerHTML = el.textContent.toUpperCase();
    });

    // Links: Render links as plain URLs
    tempDiv.querySelectorAll("a").forEach(el => {
        el.outerHTML = el.getAttribute("href") || el.href;
    });

    // Final cleanup: collapse multiple blank lines and spaces
    let output = tempDiv.innerText
        .replace(/\n\s*\n\s*\n+/g, "\n\n")
        .replace(/[ ]{2,}/g, " ")
        .trim();
    return output;
}

// Recursive list processing for both unordered and ordered lists, with whitespace filtering
function processListItems(list, level = 0) {
    let isOrdered = list.tagName.toUpperCase() === "OL";
    let output = "";
    let counter = 1;
    Array.from(list.children).forEach(item => {
        let textNodes = [];
        let nestedLists = [];
        Array.from(item.childNodes).forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                let trimmed = child.textContent.trim();
                if (trimmed) {
                    textNodes.push(trimmed);
                }
            } else if (child.nodeType === Node.ELEMENT_NODE &&
                      (child.tagName.toUpperCase() === "UL" || child.tagName.toUpperCase() === "OL")) {
                nestedLists.push(child);
            } else {
                let trimmed = child.textContent.trim();
                if (trimmed) {
                    textNodes.push(trimmed);
                }
            }
        });
        let directText = textNodes.join(" ").trim();
        let prefix = "";
        if (isOrdered && level === 0) {
            prefix = `${counter}. `;
        } else {
            // For any nested list items (from ordered or unordered), use dashed style
            prefix = "-".repeat(level + 1) + " ";
        }
        output += prefix + directText + "\n";
        nestedLists.forEach(nestedList => {
            output += processListItems(nestedList, level + 1);
        });
        counter++;
    });
    return output;
}

window.convertDumbdown = function() {
    let inputDiv = document.getElementById("input");
    if (!inputDiv) return;

    let html = inputDiv.innerHTML.trim();
    if (!html) return;

    document.getElementById("output").textContent = convertHTMLToDumbdown(html);
}

window.copyOutput = function() {
    let outputText = document.getElementById("output").textContent;
    if (!outputText) return;

    navigator.clipboard.writeText(outputText)
        .then(() => alert("Copied to clipboard!"))
        .catch(err => console.error("Error copying text: ", err));
}
