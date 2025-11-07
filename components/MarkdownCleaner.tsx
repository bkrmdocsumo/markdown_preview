import React, { useState, useEffect } from 'react';
import { cleanMarkdown } from '../services/markdownService';
import { SAMPLE_MARKDOWN } from '../constants';

const MarkdownCleaner: React.FC = () => {
    const [rawText, setRawText] = useState<string>(SAMPLE_MARKDOWN);
    const [cleanedHtml, setCleanedHtml] = useState<string>('');

    useEffect(() => {
        const cleaned = cleanMarkdown(rawText);
        setCleanedHtml(cleaned);
    }, [rawText]);

    const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setRawText(event.target.value);
    };

    return (
        <div className="flex flex-col gap-4 h-full min-h-[calc(100vh-180px)]">
            {/* Input Panel */}
            <div className="flex flex-col bg-gray-800 rounded-lg shadow-lg overflow-hidden flex-1 min-h-0">
                <h2 className="text-lg font-semibold p-4 bg-gray-700 border-b border-gray-600">Input Text</h2>
                <textarea
                    value={rawText}
                    onChange={handleTextChange}
                    placeholder="Paste your messy markdown here..."
                    className="w-full h-full flex-grow p-4 bg-gray-800 text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
            </div>

            {/* Output Panel */}
            <div className="flex flex-col bg-gray-800 rounded-lg shadow-lg overflow-hidden flex-1 min-h-0">
                <h2 className="text-lg font-semibold p-4 bg-gray-700 border-b border-gray-600">Cleaned Preview</h2>
                <div
                    className="p-6 overflow-y-auto prose prose-sm prose-invert max-w-none flex-1"
                    dangerouslySetInnerHTML={{ __html: cleanedHtml }}
                />
            </div>
        </div>
    );
};

export default MarkdownCleaner;