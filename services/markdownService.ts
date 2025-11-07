/**
 * Renders a Markdown formatted table string into an HTML table string.
 * @param tableBlock - A string containing a Markdown table.
 * @returns An HTML formatted table string.
 */
const renderMarkdownTable = (tableBlock: string): string => {
    const lines = tableBlock.trim().split('\n').filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
    if (lines.length < 2) return ''; // Needs header and separator

    const headerLine = lines[0];
    const separatorLine = lines[1];

    if (!separatorLine.includes('---')) return tableBlock; // Not a valid separator
    
    const rows = lines.slice(2);

    const headers = headerLine.split('|').map(h => h.trim()).slice(1, -1);
    const bodyRows = rows.map(rowLine => {
        const cells = rowLine.split('|').map(c => c.trim()).slice(1, -1);
        while (cells.length < headers.length) {
            cells.push('');
        }
        const finalCells = cells.slice(0, headers.length);
        return `<tr>${finalCells.map(cell => `<td class="border border-gray-600 p-2">${cell}</td>`).join('')}</tr>`;
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
};


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
    
    // 1. Convert any HTML tables to Markdown format first. The 'g' flag ensures all are replaced.
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
        const lines = trimmedBlock.split('\n');
        const htmlParts: string[] = [];
        let currentTextChunk: string[] = [];

        // Helper to process a chunk of text lines into an appropriate HTML element
        const processTextChunk = (textLines: string[]) => {
            if (textLines.length === 0) return;
            const text = textLines.join('\n').trim();
            if (!text) return;

            if (text.startsWith('# ')) {
                htmlParts.push(`<h1>${text.substring(2)}</h1>`);
            } else if (text.startsWith('## ')) {
                htmlParts.push(`<h2>${text.substring(3)}</h2>`);
            } else if (text.startsWith('<div') || text.startsWith('<img')) {
                // Pass through certain HTML elements
                htmlParts.push(text);
            } else {
                htmlParts.push(`<p>${text.replace(/\n/g, '<br />')}</p>`);
            }
        };

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            const nextLine = lines[i + 1];

            // Check for the start of a markdown table (header row + separator row)
            const isTableStart =
                line.trim().startsWith('|') && line.trim().endsWith('|') &&
                nextLine && nextLine.includes('---') && nextLine.trim().startsWith('|') && nextLine.trim().endsWith('|');

            if (isTableStart) {
                // We've found a table. First, process any text that came before it.
                processTextChunk(currentTextChunk);
                currentTextChunk = []; // Reset for the next chunk of text

                // Find the end of the table by looking for consecutive rows starting with '|'
                let tableEndIndex = i + 1;
                while (
                    tableEndIndex + 1 < lines.length &&
                    lines[tableEndIndex + 1].trim().startsWith('|') &&
                    lines[tableEndIndex + 1].trim().endsWith('|')
                ) {
                    tableEndIndex++;
                }

                const tableLines = lines.slice(i, tableEndIndex + 1);
                htmlParts.push(renderMarkdownTable(tableLines.join('\n')));

                // Move index past the processed table
                i = tableEndIndex + 1;
            } else {
                // This line is not part of a table, add it to the current text chunk
                currentTextChunk.push(line);
                i++;
            }
        }

        // After the loop, process any remaining text that was not followed by a table
        processTextChunk(currentTextChunk);

        return htmlParts.join('\n');
    });

    // Join the processed blocks back together
    return htmlBlocks.join('\n');
};
