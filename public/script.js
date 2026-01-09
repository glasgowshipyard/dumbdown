/**
 * Dumbdown Frontend Script
 * Handles Markdown to Dumbdown conversion UI
 */

const markdownInput = document.getElementById('markdown-input');
const dumbdownOutput = document.getElementById('dumbdown-output');
const convertButton = document.getElementById('convert-button');
const copyButton = document.getElementById('copy-button');
const statusElement = document.getElementById('status');
const inputCharCount = document.getElementById('input-char-count');
const outputCharCount = document.getElementById('output-char-count');

// Update character counts
function updateCounts() {
  inputCharCount.textContent = markdownInput.value.length;
  outputCharCount.textContent = dumbdownOutput.textContent.length;
}

// Convert Markdown to Dumbdown
async function convert() {
  const markdown = markdownInput.value;

  if (!markdown.trim()) {
    showStatus('Please enter some markdown to convert', 'error');
    return;
  }

  convertButton.disabled = true;
  showStatus('Converting...', 'loading');

  try {
    const response = await fetch('/convert-markdown', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ markdown })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Conversion failed');
    }

    const data = await response.json();
    dumbdownOutput.textContent = data.dumbdown;
    updateCounts();
    showStatus('Conversion successful', 'success');
  } catch (error) {
    console.error('Error:', error);
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    convertButton.disabled = false;
  }
}

// Copy output to clipboard
async function copyToClipboard() {
  if (!dumbdownOutput.textContent) {
    showStatus('Nothing to copy - convert some markdown first', 'warning');
    return;
  }

  try {
    await navigator.clipboard.writeText(dumbdownOutput.textContent);
    showStatus('Copied to clipboard', 'success');
    const originalText = copyButton.textContent;
    copyButton.textContent = 'Copied!';
    setTimeout(() => {
      copyButton.textContent = originalText;
    }, 2000);
  } catch (error) {
    console.error('Copy error:', error);
    showStatus('Failed to copy to clipboard', 'error');
  }
}

// Show status message
function showStatus(message, type = 'info') {
  statusElement.textContent = message;
  statusElement.style.color = getStatusColor(type);

  if (type !== 'loading') {
    setTimeout(() => {
      statusElement.textContent = '';
    }, 4000);
  }
}

function getStatusColor(type) {
  const colors = {
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    loading: '#fbbf24',
    info: '#94a3b8'
  };
  return colors[type] || colors.info;
}

// Event listeners
convertButton.addEventListener('click', convert);
copyButton.addEventListener('click', copyToClipboard);

// Convert on Ctrl/Cmd + Enter
markdownInput.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    convert();
  }
});

// Update character count as user types
markdownInput.addEventListener('input', updateCounts);

// Initialize character counts
window.addEventListener('load', updateCounts);
