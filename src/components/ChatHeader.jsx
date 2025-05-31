import { UserCircle } from "lucide-react"; // Icon lib
import React from "react";

const ChatHeader = ({ onToggleProfile }) => (
  <div className="bg-gradient-to-br from-purple-700 to-blue-500 text-white p-4 flex items-center justify-between text-lg font-semibold">
    <div className="flex items-center gap-3">
      <img src="/bot-avatar.png" className="w-10 h-10 rounded-full" alt="Bot" />
      Fixie-EOL Chatbot
    </div>
    <button onClick={onToggleProfile} className="hover:text-yellow-300">
      <UserCircle size={28} />
    </button>
  </div>
);

export default ChatHeader;
