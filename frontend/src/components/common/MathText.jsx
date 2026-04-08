/**
 * @fileoverview Component hiển thị text có hỗ trợ công thức toán học.
 * Sử dụng KaTeX để render LaTeX math.
 * 
 * Cú pháp hỗ trợ:
 *   - Inline math: $...$  hoặc  \(...\)
 *   - Display/block math: $$...$$ hoặc \[...\]
 * 
 * Ví dụ: "Tính $\frac{1}{2} + \sqrt{3}$"
 */

import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Render một chuỗi text có chứa công thức toán học LaTeX.
 * @param {{ children: string, style?: object, className?: string, as?: string }} props
 */
const MathText = ({ children, style, className, as: Tag = 'span' }) => {
    const html = useMemo(() => {
        if (!children || typeof children !== 'string') return '';
        return renderMathInText(children);
    }, [children]);

    if (!children || typeof children !== 'string') {
        return <Tag style={style} className={className}>{children}</Tag>;
    }

    return (
        <Tag
            style={style}
            className={className}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

/**
 * Parse text và render các phần LaTeX math thành HTML bằng KaTeX.
 * Hỗ trợ:
 *   $$...$$ → display math (block)
 *   $...$ → inline math
 *   \[...\] → display math
 *   \(...\) → inline math
 */
function renderMathInText(text) {
    // Escape HTML trước để tránh injection
    let escaped = escapeHtml(text);

    // 1. Display math: $$...$$
    escaped = escaped.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        return renderKatex(unescapeHtml(math), true);
    });

    // 2. Display math: \[...\]
    escaped = escaped.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
        return renderKatex(unescapeHtml(math), true);
    });

    // 3. Inline math: $...$  (not preceded or followed by a digit/dollar sign to avoid false positives)
    escaped = escaped.replace(/(?<!\$)\$(?!\$)((?:[^$\\]|\\.)+?)\$/g, (_, math) => {
        return renderKatex(unescapeHtml(math), false);
    });

    // 4. Inline math: \(...\)
    escaped = escaped.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
        return renderKatex(unescapeHtml(math), false);
    });

    // Preserve newlines 
    escaped = escaped.replace(/\n/g, '<br/>');

    return escaped;
}

function renderKatex(latex, displayMode) {
    try {
        return katex.renderToString(latex.trim(), {
            displayMode,
            throwOnError: false,
            strict: false,
            trust: true,
            output: 'html',
        });
    } catch (e) {
        // Fallback: show raw LaTeX in red if parsing fails
        return `<span style="color:#ef4444;font-family:monospace;" title="Lỗi công thức LaTeX">${escapeHtml(latex)}</span>`;
    }
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function unescapeHtml(str) {
    return str
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');
}

export default MathText;
