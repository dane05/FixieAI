export default function ChatMessages() { return <div>Messages</div>; }

const ChatMessages = ({ messages }) => {
  return (
    <div className="chat-messages">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`message ${msg.sender === "user" ? "user-message" : "bot-message"}`}
        >
          {msg.typing ? <em>{msg.text}</em> : msg.text}
        </div>
      ))}
    </div>
  );
};

export default ChatMessages;
