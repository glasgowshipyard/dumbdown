/**************************************
 * DUMBDOWN CLIENT - Backend-Connected
 **************************************/

document.addEventListener("DOMContentLoaded", function () {
    setupEventHandlers();
});

function setupEventHandlers() {
    document.getElementById("convert-button").addEventListener("click", handleConvert);
    document.getElementById("copy-button").addEventListener("click", copyOutput);
    document.getElementById("input").addEventListener("paste", handlePaste);
}

// =============================================================
// PASTE HANDLER
// =============================================================

function handlePaste(event) {
    event.preventDefault();
    const clipboardData = event.clipboardData || window.clipboardData;
    let content = clipboardData.getData("text/html") || clipboardData.getData("text/plain") || "";
    
    document.getElementById("input").innerHTML = sanitizeHTML(content);
}

function sanitizeHTML(html) {
    return html.replace(/<script.*?>.*?<\/script>/gi, "") // Remove scripts
               .replace(/style=".*?"/gi, "") // Remove inline styles
               .replace(/<[^>]+>/g, ""); // Remove all HTML tags
}

// =============================================================
// CONVERSION LOGIC (Now Calls Backend)
// =============================================================

function handleConvert() {
    let inputDiv = document.getElementById("input");
    let rawHtml = inputDiv.innerHTML.trim();
    
    if (!rawHtml) {
        console.warn("No text to process.");
        return;
    }
    
    // Send to backend
    fetch("/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawHtml })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("output").textContent = data.dumbdown;
    })
    .catch(error => console.error("Error processing conversion:", error));
}

// =============================================================
// COPY TO CLIPBOARD
// =============================================================

function copyOutput() {
    let outputText = document.getElementById("output").textContent;
    if (!outputText) {
        console.warn("Nothing to copy.");
        return;
    }
    navigator.clipboard.writeText(outputText).then(() => {
        alert("Copied to clipboard!");
    }).catch(err => {
        console.error("Error copying text:", err);
    });
}