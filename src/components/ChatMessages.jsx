const ChatMessages = ({ messages }) => (
  <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
    {messages.map((msg, i) => (
      <div key={i} className={`flex mb-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
        <div className={`rounded-xl px-4 py-2 max-w-[80%] ${msg.sender === "user" ? "bg-blue-600 text-white" : "bg-white text-gray-800 shadow"}`}>
          {msg.text}
        </div>
      </div>
    ))}
  </div>
);

export default ChatMessages;
