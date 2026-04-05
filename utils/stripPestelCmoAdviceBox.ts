/**
 * Removes the CMO advice block from PESTEL html_report so non–Pro Max users
 * don't see locked content; UI shows ProMaxAdviceGate instead.
 */
export function stripPestelCmoAdviceBox(html: string): { html: string; hadCmoBlock: boolean } {
    const reOpen = /<div\b[^>]*\bcmo-advice-box\b[^>]*>/i;
    const match = reOpen.exec(html);
    if (!match || match.index === undefined) {
        return { html, hadCmoBlock: false };
    }
    const start = match.index;
    let depth = 1;
    let i = start + match[0].length;
    while (i < html.length && depth > 0) {
        const nextOpen = html.toLowerCase().indexOf('<div', i);
        const nextClose = html.toLowerCase().indexOf('</div>', i);
        if (nextClose === -1) {
            return { html, hadCmoBlock: false };
        }
        if (nextOpen !== -1 && nextOpen < nextClose) {
            depth += 1;
            i = nextOpen + 4;
        } else {
            depth -= 1;
            i = nextClose + 6;
        }
    }
    if (depth !== 0) {
        return { html, hadCmoBlock: false };
    }
    const before = html.slice(0, start);
    const after = html.slice(i);
    const merged = `${before}${after}`.replace(/\n{3,}/g, '\n\n');
    return { html: merged, hadCmoBlock: true };
}
