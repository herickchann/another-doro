/**
 * Simple markdown parser for goal text
 * Supports: **bold**, *italic*, `code`, [links](url), - lists
 */
export class MarkdownParser {
    static parse(text) {
        if (!text) return '';

        let html = text;

        // Escape HTML first
        html = html.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Bold **text**
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Italic *text*
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Code `text`
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');

        // Links [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Simple list items (- item)
        html = html.replace(/^- (.+)$/gm, '• $1');

        return html;
    }

    static stripMarkdown(text) {
        if (!text) return '';

        return text
            .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold
            .replace(/\*(.*?)\*/g, '$1')      // Remove italic
            .replace(/`(.*?)`/g, '$1')        // Remove code
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove links, keep text
            .replace(/^- (.+)$/gm, '$1')      // Remove list markers
            .trim();
    }
} 