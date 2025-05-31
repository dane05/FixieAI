import ReactMarkdown from 'react-markdown';

const ChatMessages = ({ messages }) => (
  <div className="flex flex-col space-y-4 p-4 overflow-y-auto">
    {messages.map((msg, idx) => (
      <div
        key={idx}
        className={`max-w-xl px-4 py-3 rounded-lg shadow text-sm whitespace-pre-wrap ${
          msg.sender === 'user'
            ? 'bg-blue-600 text-white self-end'
            : 'bg-gray-100 text-gray-800 self-start'
        }`}
      >
        <ReactMarkdown>{msg.text}</ReactMarkdown>
      </div>
    ))}
  </div>
);

export default ChatMessages;
