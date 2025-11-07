export const cleanMarkdown = (rawText: string): string => {
    if (!rawText) {
        return "";
    }

    // Handle literal '\n' and '\"' strings.
    let processedText = rawText
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"');

    // 1. Standardize line endings to \n
    processedText = processedText.replace(/\r\n/g, '\n');

    // 2. Collapse more than 2 consecutive newlines into exactly 2
    processedText = processedText.replace(/\n{3,}/g, '\n\n');

    // 3. Split the text into blocks based on double newlines
    const blocks = processedText.trim().split('\n\n');

    const htmlBlocks = blocks.map(block => {
        const trimmedBlock = block.trim();

        // 4. Handle Markdown Tables
        const isTable = trimmedBlock.includes('|') && trimmedBlock.includes('---');
        if (isTable) {
            const lines = trimmedBlock.split('\n').filter(line => line.includes('|'));
            if (lines.length > 1) { // Header and at least one separator line
                const headerLine = lines[0];
                const rows = lines.slice(2);

                const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
                const bodyRows = rows.map(rowLine => {
                    const cells = rowLine.split('|').map(c => c.trim()).filter(Boolean);
                    return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
                });

                return `
                    <table>
                        <thead>
                            <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${bodyRows.join('')}
                        </tbody>
                    </table>
                `;
            }
        }

        // 5. Handle HTML blocks: if a block starts with a known HTML tag, leave it as is.
        if (trimmedBlock.startsWith('<div') || trimmedBlock.startsWith('<table') || trimmedBlock.startsWith('<img')) {
            return trimmedBlock;
        }

        // 6. Handle Markdown-like headers
        if (trimmedBlock.startsWith('# ')) {
            return `<h1>${trimmedBlock.substring(2)}</h1>`;
        }
        if (trimmedBlock.startsWith('## ')) {
            return `<h2>${trimmedBlock.substring(3)}</h2>`;
        }

        // 7. For all other blocks, treat them as paragraphs.
        // Replace single newlines within the block with <br /> for line breaks.
        return `<p>${trimmedBlock.replace(/\n/g, '<br />')}</p>`;
    });

    // 8. Join the processed blocks back together
    return htmlBlocks.join('\n');
};