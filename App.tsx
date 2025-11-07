
import React from 'react';
import MarkdownCleaner from './components/MarkdownCleaner';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <header className="bg-gray-800 shadow-md p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-cyan-400">Markdown Cleaner & Previewer</h1>
          <p className="text-gray-400">Instantly tidy up and visualize your messy markdown text.</p>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4">
        <MarkdownCleaner />
      </main>
      <footer className="bg-gray-800 text-center p-4 text-sm text-gray-500">
        <p>Built by a world-class senior frontend React engineer.</p>
      </footer>
    </div>
  );
}

export default App;
