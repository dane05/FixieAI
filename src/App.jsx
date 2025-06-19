import React, { useState, useEffect } from "react";
import { db } from "./firebase";

import useVoiceRecognition from "./hooks/useVoiceRecognition";
import useSpeechSynthesis from "./hooks/useSpeechSynthesis";
import useFuseSearch from "./hooks/useFuseSearch";
import { useAuth } from "./hooks/useAuth";
import { useFaq } from "./hooks/useFaq";
import { useChatbot } from "./hooks/useChatbot";

import ChatHeader from "./components/ChatHeader";
import ChatMessages from "./components/ChatMessages";
import InputControls from "./components/InputControls";
import Suggestions from "./components/Suggestions";
import ProfileCard from "./components/ProfileCard";
import Feedback from "./components/Feedback";
import LoginScreen from "./components/LoginScreen";

const App = () => {
  const [user, setUser] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [teachMode, setTeachMode] = useState(false);
  const [tempProblem, setTempProblem] = useState("");
  const [mute, setMute] = useState(true);
  const [inputFromVoice, setInputFromVoice] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [usePdfOnly, setUsePdfOnly] = useState(false);
  const [pdfText, setPdfText] = useState(""); // extracted PDF content

  // Hooks for FAQ and search
  const { faq, suggestions, reload: reloadFaq } = useFaq();
  const search = useFuseSearch(faq);

  // Speech & voice hooks
  const { speak } = useSpeechSynthesis();
  const { startListening } = useVoiceRecognition((transcript, fromVoice = true) => {
    setInput(transcript);
    setInputFromVoice(fromVoice);
    setTimeout(() => handleSend(), 100);
  });

  // Auth
  const { login, logout } = useAuth(setUser, setMessages);

  // Chatbot logic
  const { handleSend, loading } = useChatbot({
    user,
    faq,
    speak,
    mute,
    search,
    setMessages,
    setUser,
    setTeachMode,
    setTempProblem,
    setPendingFeedback,
  });

  useEffect(() => {
    reloadFaq();
  }, [reloadFaq]);

  useEffect(() => {
    if (user) {
      setMessages([
        {
          text: `Hello ${user.name}! I'm Fixie, your AI Troubleshooting Assistant. How can I help you today?`,
          sender: "bot",
        },
      ]);
    }
  }, [user]);

  if (!user) {
    return (
      <LoginScreen
        nameInput={nameInput}
        setNameInput={setNameInput}
        handleLogin={() => login(nameInput)}
      />
    );
  }

  return (
    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden mx-auto mt-4">
      <ChatHeader onToggleProfile={() => setShowProfile(!showProfile)} />
      {showProfile && <ProfileCard user={user} />}
      <div className="flex justify-between items-center px-4 pt-2 text-sm text-gray-600">
        <span>👋 Hello, {user.name}! Points: {user.points}</span>
        <button onClick={logout} className="text-red-500 underline">
          Logout
        </button>
      </div>
      <div className="px-4 pt-2 flex items-center gap-4">
  <label className="text-sm font-medium">
    <input
      type="checkbox"
      checked={usePdfOnly}
      onChange={() => setUsePdfOnly(!usePdfOnly)}
      className="mr-2"
    />
    Use PDF Only
  </label>

  <input
    type="file"
    accept="application/pdf"
    onChange={handlePdfUpload}
    className="text-sm"
  />
</div>

      <ChatMessages
        messages={messages}
        onFeedback={(vote) => {
          setPendingFeedback(null);
          setMessages((prev) => [
            ...prev,
            {
              text:
                vote === "yes"
                  ? "Thanks for the feedback!"
                  : "I'll try to do better!",
              sender: "bot",
            },
          ]);
        }}
      />
      <Suggestions suggestions={suggestions} onSelect={setInput} />
      <InputControls
        input={input}
        setInput={setInput}
        onSend={() =>
          handleSend(
            input,
            setInput,
            inputFromVoice,
            setInputFromVoice,
            tempProblem,
            setTempProblem,
            teachMode,
            setTeachMode
          )
        }
        onVoice={startListening}
        mute={mute}
        setMute={setMute}
        loading={loading}
      />
    </div>
  );
};

export default App;
