import ReactMarkdown from 'react-markdown';

const ChatMessages = ({ messages }) => (
  <div className="flex-1 overflow-y-auto max-h-[70vh] p-4 flex flex-col space-y-4">
    {messages.map((msg, idx) => (
      <div
        key={idx}
        className={`max-w-xl px-4 py-3 rounded-lg shadow text-sm whitespace-pre-wrap ${
          msg.sender === 'user'
            ? 'bg-blue-600 text-white self-end'
            : 'bg-gray-100 text-gray-800 self-start'
        }`}
      >
        <ReactMarkdown>{String(msg.text || '')}</ReactMarkdown>
      </div>
    ))}
  </div>
);

export default ChatMessages;
