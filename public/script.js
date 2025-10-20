/**
 * Dumbdown Frontend Script
 * Handles HTML to Dumbdown conversion UI
 */

const inputElement = document.getElementById('input');
const outputElement = document.getElementById('output');
const convertButton = document.getElementById('convert-button');
const copyButton = document.getElementById('copy-button');
const clearButton = document.getElementById('clear-button');
const statusElement = document.getElementById('status');
const inputCharCount = document.getElementById('input-char-count');
const outputCharCount = document.getElementById('output-char-count');

// Store raw HTML from paste events (not the rendered DOM)
let rawPastedHTML = '';

// Update character counts
function updateCounts() {
  inputCharCount.textContent = inputElement.textContent.length;
  outputCharCount.textContent = outputElement.textContent.length;
}

// Convert HTML to Dumbdown
async function convert() {
  // Use stored raw HTML if available, otherwise use current content
  const html = rawPastedHTML || inputElement.innerHTML;

  if (!html.trim()) {
    showStatus('Please paste some HTML to convert', 'error');
    return;
  }

  convertButton.disabled = true;
  showStatus('Converting...', 'loading');

  try {
    const response = await fetch('/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: html })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Conversion failed');
    }

    const data = await response.json();
    outputElement.textContent = data.dumbdown;
    updateCounts();
    showStatus('✅ Conversion successful!', 'success');
  } catch (error) {
    console.error('Error:', error);
    showStatus(`❌ Error: ${error.message}`, 'error');
  } finally {
    convertButton.disabled = false;
  }
}

// Copy output to clipboard
async function copyToClipboard() {
  if (!outputElement.textContent) {
    showStatus('Nothing to copy - convert some HTML first', 'warning');
    return;
  }

  try {
    await navigator.clipboard.writeText(outputElement.textContent);
    showStatus('✅ Copied to clipboard!', 'success');
    copyButton.textContent = '✓ Copied';
    setTimeout(() => {
      copyButton.textContent = '📋 Copy';
    }, 2000);
  } catch (error) {
    console.error('Copy error:', error);
    showStatus('❌ Failed to copy to clipboard', 'error');
  }
}

// Clear all content
function clearAll() {
  inputElement.textContent = '';
  outputElement.textContent = '';
  statusElement.textContent = '';
  rawPastedHTML = '';
  updateCounts();
  inputElement.focus();
}

// Show status message
function showStatus(message, type = 'info') {
  statusElement.textContent = message;
  statusElement.className = `mt-6 text-center text-sm min-h-6 ${getStatusClass(type)}`;

  if (type !== 'loading' && type !== 'info') {
    setTimeout(() => {
      statusElement.textContent = '';
    }, 4000);
  }
}

function getStatusClass(type) {
  switch (type) {
    case 'error':
      return 'text-red-400';
    case 'success':
      return 'text-green-400';
    case 'warning':
      return 'text-yellow-400';
    case 'loading':
      return 'text-blue-400 animate-pulse';
    default:
      return 'text-slate-400';
  }
}

// Event listeners
convertButton.addEventListener('click', convert);
copyButton.addEventListener('click', copyToClipboard);
clearButton.addEventListener('click', clearAll);

// Convert on Enter (Ctrl/Cmd + Enter)
inputElement.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    convert();
  }
  // Update counts as user types
  setTimeout(updateCounts, 0);
});

// Handle paste events
inputElement.addEventListener('paste', (e) => {
  e.preventDefault();

  // Get paste data - prefer HTML, fallback to plain text
  const html = (e.clipboardData || window.clipboardData).getData('text/html') ||
               (e.clipboardData || window.clipboardData).getData('text/plain');

  if (html) {
    // Store the raw HTML for conversion
    rawPastedHTML = html;

    // Display as plain text (not rendered) so user can see the HTML
    inputElement.textContent = html;

    setTimeout(updateCounts, 0);
    showStatus('📝 Pasted HTML - click Convert to process', 'info');
  }
});

// Handle input events for character count
inputElement.addEventListener('input', updateCounts);
inputElement.addEventListener('change', updateCounts);

// Focus on load
window.addEventListener('load', () => {
  inputElement.focus();
  updateCounts();
});
