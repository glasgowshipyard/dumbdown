/**
 * Dumbstack Editor
 * WYSIWYG-style toolbar that manipulates plain text in dumbdown format
 */

const editor = document.getElementById('editor');
const previewContainer = document.getElementById('previewContainer');
const editorContainer = document.getElementById('editorContainer');
const preview = document.getElementById('preview');
const previewToggle = document.getElementById('previewToggle');

let isPreviewMode = false;

/**
 * Insert formatting at cursor position or wrap selection
 */
function insertFormat(format) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const selectedText = text.substring(start, end);

    let newText, newCursorPos;

    if (format === '//' || format === '///') {
        // Insert heading at start of line
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = text.indexOf('\n', start);
        const line = lineEnd === -1 ? text.substring(lineStart) : text.substring(lineStart, lineEnd);

        // Remove existing heading markers if present
        const cleanLine = line.replace(/^\/\/\/?\s*/, '');

        const before = text.substring(0, lineStart);
        const after = lineEnd === -1 ? '' : text.substring(lineEnd);

        newText = before + format + ' ' + cleanLine + after;
        newCursorPos = lineStart + format.length + 1 + cleanLine.length;
    } else if (format === '`') {
        // Wrap selection in backticks
        if (selectedText) {
            newText = text.substring(0, start) + '`' + selectedText + '`' + text.substring(end);
            newCursorPos = end + 2;
        } else {
            newText = text.substring(0, start) + '``' + text.substring(end);
            newCursorPos = start + 1;
        }
    } else if (format === '-' || format === '--') {
        // Insert list marker at start of line
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const before = text.substring(0, lineStart);
        const after = text.substring(lineStart);

        newText = before + format + ' ' + after;
        newCursorPos = lineStart + format.length + 1;
    }

    editor.value = newText;
    editor.focus();
    editor.setSelectionRange(newCursorPos, newCursorPos);
}

/**
 * Toggle ALL CAPS for selected text
 */
function toggleAllCaps() {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const selectedText = text.substring(start, end);

    if (!selectedText) {
        return;
    }

    const isAllCaps = selectedText === selectedText.toUpperCase() && selectedText !== selectedText.toLowerCase();
    const newText = isAllCaps ? selectedText.toLowerCase() : selectedText.toUpperCase();

    editor.value = text.substring(0, start) + newText + text.substring(end);
    editor.focus();
    editor.setSelectionRange(start, start + newText.length);
}

/**
 * Insert code block
 */
function insertCodeBlock() {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const selectedText = text.substring(start, end);

    const codeBlock = selectedText
        ? '```\n' + selectedText + '\n```'
        : '```\n\n```';

    const newText = text.substring(0, start) + codeBlock + text.substring(end);
    editor.value = newText;
    editor.focus();

    const cursorPos = selectedText ? start + codeBlock.length : start + 4;
    editor.setSelectionRange(cursorPos, cursorPos);
}

/**
 * Insert numbered list
 */
function insertNumberedList() {
    const start = editor.selectionStart;
    const text = editor.value;

    // Insert at start of line
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const before = text.substring(0, lineStart);
    const after = text.substring(lineStart);

    const newText = before + '1. ' + after;
    editor.value = newText;
    editor.focus();
    editor.setSelectionRange(lineStart + 3, lineStart + 3);
}

/**
 * Insert LaTeX math
 */
function insertMath() {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const selectedText = text.substring(start, end);

    let mathExpression;
    let cursorOffset;

    if (selectedText) {
        // Wrap selection in $ $
        mathExpression = '$' + selectedText + '$';
        cursorOffset = mathExpression.length;
    } else {
        // Insert empty math expression
        mathExpression = '$$';
        cursorOffset = 1;
    }

    const newText = text.substring(0, start) + mathExpression + text.substring(end);
    editor.value = newText;
    editor.focus();
    editor.setSelectionRange(start + cursorOffset, start + cursorOffset);
}

/**
 * Toggle preview mode
 */
function togglePreview() {
    isPreviewMode = !isPreviewMode;

    if (isPreviewMode) {
        editorContainer.classList.add('hidden');
        previewContainer.classList.remove('hidden');
        previewToggle.classList.add('active');
        renderPreview();
    } else {
        editorContainer.classList.remove('hidden');
        previewContainer.classList.add('hidden');
        previewToggle.classList.remove('active');
    }
}

/**
 * Render dumbdown to HTML preview
 */
function renderPreview() {
    const text = editor.value;
    let html = '';

    // Split into lines
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeBlockContent = [];
    let codeBlockLanguage = '';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Handle code blocks
        if (line.trim().startsWith('```')) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                codeBlockLanguage = line.trim().substring(3).trim();
                codeBlockContent = [];
            } else {
                // End code block
                const code = codeBlockContent.join('\n');
                const escaped = escapeHtml(code);
                const langClass = codeBlockLanguage ? `language-${codeBlockLanguage}` : '';
                html += `<pre><code class="${langClass}">${escaped}</code></pre>`;
                inCodeBlock = false;
                codeBlockContent = [];
                codeBlockLanguage = '';
            }
            continue;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
        }

        // Skip document markers
        if (line.trim() === '+++') {
            continue;
        }

        // Handle headings
        if (line.startsWith('/// ')) {
            html += `<h2>${escapeHtml(line.substring(4))}</h2>`;
            continue;
        }

        if (line.startsWith('// ')) {
            html += `<h1>${escapeHtml(line.substring(3))}</h1>`;
            continue;
        }

        // Handle lists
        if (line.match(/^--\s+/)) {
            html += `<ul style="margin-left: 2rem;"><li>${processInline(line.substring(3))}</li></ul>`;
            continue;
        }

        if (line.match(/^-\s+/)) {
            html += `<ul><li>${processInline(line.substring(2))}</li></ul>`;
            continue;
        }

        if (line.match(/^\d+\.\s+/)) {
            const match = line.match(/^(\d+)\.\s+(.+)$/);
            html += `<ol start="${match[1]}"><li>${processInline(match[2])}</li></ol>`;
            continue;
        }

        // Handle quotes
        if (line.startsWith('"') && line.endsWith('"')) {
            html += `<blockquote>${processInline(line.substring(1, line.length - 1))}</blockquote>`;
            continue;
        }

        // Handle blank lines
        if (line.trim() === '') {
            html += '<br>';
            continue;
        }

        // Regular paragraph
        html += `<p>${processInline(line)}</p>`;
    }

    preview.innerHTML = html;

    // Render LaTeX with KaTeX
    renderMath();

    // Syntax highlight code blocks
    Prism.highlightAllUnder(preview);
}

/**
 * Process inline formatting (code, math)
 */
function processInline(text) {
    let result = escapeHtml(text);

    // Protect LaTeX math from further processing
    const mathExpressions = [];
    result = result.replace(/\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$/g, (match) => {
        const placeholder = `__MATH_${mathExpressions.length}__`;
        mathExpressions.push(match);
        return placeholder;
    });

    // Protect inline code
    const codeExpressions = [];
    result = result.replace(/`([^`]+?)`/g, (match, code) => {
        const placeholder = `__CODE_${codeExpressions.length}__`;
        codeExpressions.push(`<code>${code}</code>`);
        return placeholder;
    });

    // Restore inline code
    codeExpressions.forEach((code, index) => {
        result = result.replace(`__CODE_${index}__`, code);
    });

    // Restore math (keep as-is for KaTeX to process)
    mathExpressions.forEach((math, index) => {
        result = result.replace(`__MATH_${index}__`, math);
    });

    return result;
}

/**
 * Render LaTeX math with KaTeX
 */
function renderMath() {
    const mathElements = preview.querySelectorAll('p, li, blockquote, h1, h2');

    mathElements.forEach(element => {
        let html = element.innerHTML;

        // Render display math $$...$$
        html = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
            try {
                return katex.renderToString(math, { displayMode: true, throwOnError: false });
            } catch (e) {
                return match;
            }
        });

        // Render inline math $...$
        html = html.replace(/\$([^\$\n]+?)\$/g, (match, math) => {
            try {
                return katex.renderToString(math, { displayMode: false, throwOnError: false });
            } catch (e) {
                return match;
            }
        });

        element.innerHTML = html;
    });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-update preview when typing (with debounce)
let previewTimeout;
editor.addEventListener('input', () => {
    if (isPreviewMode) {
        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(renderPreview, 300);
    }
});

// Keyboard shortcuts
editor.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + B for bold (ALL CAPS)
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleAllCaps();
    }

    // Ctrl/Cmd + E for preview toggle
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        togglePreview();
    }

    // Enter key: auto-continue lists
    if (e.key === 'Enter') {
        const start = editor.selectionStart;
        const text = editor.value;

        // Find the current line
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const currentLine = text.substring(lineStart, start);

        // Check if we're on a list item
        const unorderedMatch = currentLine.match(/^(-+)\s/);
        const numberedMatch = currentLine.match(/^(\d+)\.\s/);
        const alphaMatch = currentLine.match(/^\s*([a-z])\.\s/);

        if (unorderedMatch) {
            // If the line is just the marker (empty list item)
            if (currentLine.trim() === unorderedMatch[0].trim()) {
                e.preventDefault();
                const dashes = unorderedMatch[1];

                if (dashes.length > 1) {
                    // Nested item: outdent (remove one dash)
                    const newDashes = dashes.substring(0, dashes.length - 1);
                    const before = text.substring(0, lineStart);
                    const after = text.substring(start);
                    editor.value = before + newDashes + ' ' + after;
                    editor.selectionStart = editor.selectionEnd = lineStart + newDashes.length + 1;
                } else {
                    // Top level: exit list
                    const before = text.substring(0, lineStart);
                    const after = text.substring(start);
                    editor.value = before + '\n' + after;
                    editor.selectionStart = editor.selectionEnd = lineStart + 1;
                }
            } else {
                // Continue the list with same dash level
                e.preventDefault();
                const dashes = unorderedMatch[1];
                const newListItem = '\n' + dashes + ' ';
                const before = text.substring(0, start);
                const after = text.substring(start);
                editor.value = before + newListItem + after;
                editor.selectionStart = editor.selectionEnd = start + newListItem.length;
            }
        } else if (alphaMatch) {
            // If the line is just the letter (empty alphabetical list item)
            if (currentLine.trim() === alphaMatch[0].trim()) {
                e.preventDefault();

                // Find the previous numbered item to continue sequence
                const textBefore = text.substring(0, lineStart);
                const prevNumberMatch = textBefore.match(/(\d+)\.\s[^\n]*$/m);
                const nextNumber = prevNumberMatch ? parseInt(prevNumberMatch[1]) + 1 : 1;

                // Outdent to numbered list
                const before = text.substring(0, lineStart);
                const after = text.substring(start);
                editor.value = before + nextNumber + '. ' + after;
                editor.selectionStart = editor.selectionEnd = lineStart + (nextNumber + '. ').length;
            } else {
                // Continue alphabetical list with next letter
                e.preventDefault();
                const currentLetter = alphaMatch[1];
                const nextLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
                const newListItem = '\n  ' + nextLetter + '. ';
                const before = text.substring(0, start);
                const after = text.substring(start);
                editor.value = before + newListItem + after;
                editor.selectionStart = editor.selectionEnd = start + newListItem.length;
            }
        } else if (numberedMatch) {
            // If the line is just the number (empty list item), exit list
            if (currentLine.trim() === numberedMatch[0].trim()) {
                e.preventDefault();
                const before = text.substring(0, lineStart);
                const after = text.substring(start);
                editor.value = before + '\n' + after;
                editor.selectionStart = editor.selectionEnd = lineStart + 1;
            } else {
                // Continue numbered list with incremented number
                e.preventDefault();
                const nextNumber = parseInt(numberedMatch[1]) + 1;
                const newListItem = '\n' + nextNumber + '. ';
                const before = text.substring(0, start);
                const after = text.substring(start);
                editor.value = before + newListItem + after;
                editor.selectionStart = editor.selectionEnd = start + newListItem.length;
            }
        }
    }

    // Tab key: increase list nesting or insert spaces
    if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const start = editor.selectionStart;
        const text = editor.value;

        // Find the current line
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = text.indexOf('\n', start);
        const currentLine = lineEnd === -1 ? text.substring(lineStart) : text.substring(lineStart, lineEnd);

        // Check what type of list item we're on
        const unorderedMatch = currentLine.match(/^(-+)\s(.*)$/);
        const numberedMatch = currentLine.match(/^(\d+)\.\s(.*)$/);
        const alphaMatch = currentLine.match(/^\s*([a-z])\.\s(.*)$/);

        if (numberedMatch) {
            // Convert numbered item to alphabetical sub-item
            const content = numberedMatch[2];
            const newLine = '  a. ' + content;
            const before = text.substring(0, lineStart);
            const after = lineEnd === -1 ? '' : text.substring(lineEnd);
            editor.value = before + newLine + after;
            // Adjust cursor position
            const oldPrefix = numberedMatch[1] + '. ';
            const newPrefix = '  a. ';
            editor.selectionStart = editor.selectionEnd = start - oldPrefix.length + newPrefix.length;
        } else if (unorderedMatch) {
            // Add another dash for nesting
            const newLine = currentLine.replace(/^(-+)/, '$1-');
            const before = text.substring(0, lineStart);
            const after = lineEnd === -1 ? '' : text.substring(lineEnd);
            editor.value = before + newLine + after;
            editor.selectionStart = editor.selectionEnd = start + 1;
        } else {
            // Just insert two spaces
            const before = text.substring(0, start);
            const after = text.substring(start);
            editor.value = before + '  ' + after;
            editor.selectionStart = editor.selectionEnd = start + 2;
        }
    }

    // Shift+Tab: decrease list nesting
    if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        const start = editor.selectionStart;
        const text = editor.value;

        // Find the current line
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = text.indexOf('\n', start);
        const currentLine = lineEnd === -1 ? text.substring(lineStart) : text.substring(lineStart, lineEnd);

        // Check if we're on a nested list item
        const unorderedMatch = currentLine.match(/^(--+)\s(.*)$/);
        const alphaMatch = currentLine.match(/^\s*([a-z])\.\s(.*)$/);

        if (alphaMatch) {
            // Convert alphabetical sub-item back to numbered item
            const content = alphaMatch[2];

            // Find the previous numbered item to continue sequence
            const textBefore = text.substring(0, lineStart);
            const prevNumberMatch = textBefore.match(/(\d+)\.\s[^\n]*$/m);
            const nextNumber = prevNumberMatch ? parseInt(prevNumberMatch[1]) + 1 : 1;

            const newLine = nextNumber + '. ' + content;
            const before = text.substring(0, lineStart);
            const after = lineEnd === -1 ? '' : text.substring(lineEnd);
            editor.value = before + newLine + after;

            // Adjust cursor position
            const oldPrefixLength = currentLine.indexOf(alphaMatch[1] + '. ') + 3;
            const newPrefix = nextNumber + '. ';
            editor.selectionStart = editor.selectionEnd = start - oldPrefixLength + newPrefix.length;
        } else if (unorderedMatch) {
            const dashes = unorderedMatch[1];
            const content = unorderedMatch[2];

            if (dashes.length > 1) {
                // Remove one dash for un-nesting
                const newLine = currentLine.replace(/^(--)(-*)/, '-$2');
                const before = text.substring(0, lineStart);
                const after = lineEnd === -1 ? '' : text.substring(lineEnd);
                editor.value = before + newLine + after;
                editor.selectionStart = editor.selectionEnd = start - 1;
            }
        }
    }
});
