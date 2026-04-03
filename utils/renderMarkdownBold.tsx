import React from 'react';

/**
 * Renders plain text with **double-asterisk** segments as <strong>.
 * Safe for AI output that uses markdown-style bold without full markdown parsing.
 */
export function renderMarkdownBoldSegments(text: string | undefined | null): React.ReactNode {
    if (text == null || text === '') return text ?? '';
    const nodes: React.ReactNode[] = [];
    const re = /\*\*([\s\S]*?)\*\*/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let key = 0;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) {
            nodes.push(text.slice(last, m.index));
        }
        nodes.push(<strong key={key++}>{m[1]}</strong>);
        last = m.index + m[0].length;
    }
    if (last < text.length) {
        nodes.push(text.slice(last));
    }
    return nodes.length ? <>{nodes}</> : text;
}
