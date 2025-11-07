/**
 * Converts an HTML table string into a Markdown formatted table.
 * It handles simple tables, extracting text from `<th>` and `<td>` elements,
 * and skips complex rows containing `colspan` or `rowspan`.
 * @param tableHtml - The HTML string of the table.
 * @returns A Markdown formatted table string.
 */
const htmlTableToMarkdown = (tableHtml: string): string => {
    const rows: string[][] = [];

    // A simple parser to avoid heavy libraries
    const parser = {
        getRows: (html: string) => [...html.matchAll(/<tr[^>]*>(.*?)<\/tr>/gis)],
        getCells: (rowHtml: string) => [...rowHtml.matchAll(/<(?:td|th)[^>]*>(.*?)<\/(?:td|th)>/gis)],
        stripTags: (cellHtml: string) => cellHtml.replace(/<[^>]+>/g, '').trim(),
    };

    const rowMatches = parser.getRows(tableHtml);
    if (!rowMatches.length) return tableHtml;

    let headerCells: string[] = [];
    const bodyRows: string[][] = [];

    for (const rowMatch of rowMatches) {
        const rowHtml = rowMatch[1];
        // Skip complex rows that Markdown doesn't support well
        if (rowHtml.includes('colspan') || rowHtml.includes('rowspan')) {
            continue;
        }

        const cellMatches = parser.getCells(rowHtml);
        const currentCells = cellMatches.map(cellMatch => parser.stripTags(cellMatch[1]));

        if (currentCells.every(cell => cell === '')) continue; // Skip empty rows

        if (headerCells.length === 0 && currentCells.length > 0) {
            headerCells = currentCells;
        } else if (currentCells.length > 0) {
            bodyRows.push(currentCells);
        }
    }

    if (headerCells.length === 0) {
        return "<!-- Could not parse HTML table -->";
    }
    
    const maxCols = headerCells.length;

    // Build Markdown
    const mdHeader = `| ${headerCells.join(' | ')} |`;
    const mdSeparator = `| ${headerCells.map(() => '---').join(' | ')} |`;
    const mdBody = bodyRows.map(row => {
        // Pad rows that might be shorter
        while (row.length < maxCols) {
            row.push('');
        }
        // Truncate rows that might be longer
        const finalRow = row.slice(0, maxCols);
        return `| ${finalRow.join(' | ')} |`;
    }).join('\n');

    return `${mdHeader}\n${mdSeparator}\n${mdBody}`;
};


export const cleanMarkdown = (rawText: string): string => {
    if (!rawText) {
        return "";
    }
    
    // 1. Convert any HTML tables to Markdown format first.
    let processedText = rawText.replace(
        /<table[^>]*>[\s\S]*?<\/table>/gi, 
        (match) => htmlTableToMarkdown(match)
    );

    // Handle literal '\n' and '\"' strings.
    processedText = processedText
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"');

    // 2. Standardize line endings to \n
    processedText = processedText.replace(/\r\n/g, '\n');

    // 3. Collapse more than 2 consecutive newlines into exactly 2
    processedText = processedText.replace(/\n{3,}/g, '\n\n');

    // 4. Split the text into blocks based on double newlines
    const blocks = processedText.trim().split('\n\n');

    const htmlBlocks = blocks.map(block => {
        const trimmedBlock = block.trim();

        // 5. Handle Markdown Tables
        const isTable = trimmedBlock.includes('|') && trimmedBlock.includes('---');
        if (isTable) {
            const lines = trimmedBlock.split('\n').filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
            if (lines.length > 1) { // Header and at least one separator line
                const headerLine = lines[0];
                const rows = lines.slice(2);

                const headers = headerLine.split('|').map(h => h.trim()).slice(1, -1);
                const bodyRows = rows.map(rowLine => {
                    const cells = rowLine.split('|').map(c => c.trim()).slice(1, -1);
                     // Pad cells if row is shorter than header
                    while (cells.length < headers.length) {
                        cells.push('');
                    }
                    return `<tr>${cells.map(cell => `<td class="border border-gray-600 p-2">${cell}</td>`).join('')}</tr>`;
                });

                return `
                    <table class="table-auto w-full border-collapse border border-gray-600">
                        <thead>
                            <tr>${headers.map(header => `<th class="border border-gray-600 p-2">${header}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${bodyRows.join('')}
                        </tbody>
                    </table>
                `;
            }
        }

        // 6. Handle HTML blocks: if a block starts with a known HTML tag, leave it as is.
        if (trimmedBlock.startsWith('<div') || trimmedBlock.startsWith('<table') || trimmedBlock.startsWith('<img')) {
            return trimmedBlock;
        }

        // 7. Handle Markdown-like headers
        if (trimmedBlock.startsWith('# ')) {
            return `<h1>${trimmedBlock.substring(2)}</h1>`;
        }
        if (trimmedBlock.startsWith('## ')) {
            return `<h2>${trimmedBlock.substring(3)}</h2>`;
        }

        // 8. For all other blocks, treat them as paragraphs.
        // Replace single newlines within the block with <br /> for line breaks.
        return `<p>${trimmedBlock.replace(/\n/g, '<br />')}</p>`;
    });

    // 9. Join the processed blocks back together
    return htmlBlocks.join('\n');
};