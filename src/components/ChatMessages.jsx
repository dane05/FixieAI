import React from 'react';
import { marked } from 'marked';

function renderMessage(content) {
  const html = marked(content);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function ChatMessage({ message, isUser }) {
  return (
    <div className={`p-4 rounded-lg my-2 max-w-xl ${
      isUser ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 text-black self-start'
    }`}>
      {renderMessage(message)}
    </div>
  );
}
