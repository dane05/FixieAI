import React from 'react';
import { marked } from 'marked';

function renderMessage(content) {
  const html = marked(content);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

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
