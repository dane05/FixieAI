import ReactMarkdown from "react-markdown";
import Feedback from "./Feedback";

// Import avatars from src/assets
import botAvatar from "../assets/bot-avatar.png";
import userAvatar from "../assets/user-avatar.png";

const ChatMessages = ({ messages, onFeedback }) => (
  <div className="flex-1 overflow-y-auto max-h-[70vh] p-4 flex flex-col space-y-4">
    {messages.map((msg, idx) => {
      if (msg.type === "feedback") {
        return (
          <div key={idx} className="flex items-start gap-3 self-start">
            <img
              src={botAvatar}
              alt="Bot"
              className="w-8 h-8 rounded-full"
            />
            <div className="max-w-xl px-4 py-3 rounded-lg shadow text-sm bg-gray-100 text-gray-800">
              <Feedback onFeedback={onFeedback} />
            </div>
          </div>
        );
      }

      const isUser = msg.sender === "user";

      return (
        <div
          key={idx}
          className={`flex max-w-xl ${
            isUser ? "self-end flex-row-reverse" : "self-start"
          } items-start gap-2`}
        >
          {/* Avatar */}
          <img
            src={isUser ? userAvatar : botAvatar}
            alt={isUser ? "User avatar" : "Bot avatar"}
            className="w-8 h-8 rounded-full object-cover"
          />

          {/* Message bubble */}
          <div
            className={`px-4 py-3 rounded-lg shadow text-sm whitespace-pre-wrap max-w-[70vw] ${
              isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
            }`}
          >
            <ReactMarkdown>{String(msg.text || "")}</ReactMarkdown>
          </div>
        </div>
      );
    })}
  </div>
);

export default ChatMessages;
