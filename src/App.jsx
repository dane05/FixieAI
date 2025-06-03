import React, { useEffect, useState } from "react";
import { db, gemini } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";

import useVoiceRecognition from "./hooks/useVoiceRecognition";
import useSpeechSynthesis from "./hooks/useSpeechSynthesis";
import useFuseSearch from "./hooks/useFuseSearch";

import ChatHeader from "./components/ChatHeader";
import ChatMessages from "./components/ChatMessages";
import InputControls from "./components/InputControls";
import Suggestions from "./components/Suggestions";
import ProfileCard from "./components/ProfileCard";
import Feedback from "./components/Feedback";

const App = () => {
  const [user, setUser] = useState(null); // null when not logged in
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [faq, setFaq] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [teachMode, setTeachMode] = useState(false);
  const [tempProblem, setTempProblem] = useState("");
  const [mute, setMute] = useState(false);
  const [inputFromVoice, setInputFromVoice] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState(null);
  const [loading, setLoading] = useState(false); // for "thinking" message
  const [nameInput, setNameInput] = useState("");

  const { speak } = useSpeechSynthesis();
  const { startListening } = useVoiceRecognition((transcript) => {
    setInput(transcript);
    setInputFromVoice(fromVoice);
    setTimeout(handleSend, 100);
  });

  const search = useFuseSearch(faq);

  // Helper to load chatbotKnowledge collection into faq & suggestions
  const loadFaq = async () => {
    const snap = await getDocs(collection(db, "chatbotKnowledge"));
    const data = snap.docs.map((doc) => ({ text: doc.id, ...doc.data() }));
    setFaq(data);
    setSuggestions(data.map((d) => d.text).slice(0, 4));
  };

  useEffect(() => {
    loadFaq();
  }, []);

  // ---- LOGIN FUNCTION ----
  const handleLogin = async () => {
    const name = nameInput.trim();
    if (!name) return;

    const userDocRef = doc(db, "users", name);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      setUser(userSnap.data());
    } else {
      const newUser = { name, points: 0 };
      await setDoc(userDocRef, newUser);
      setUser(newUser);
    }
    setNameInput("");
    setMessages([]); // clear chat on login
  };

  const handleLogout = () => {
    setUser(null);
    setMessages([]);
  };

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

  const callGeminiWithRetry = async (prompt, retries = 3, delay = 1000) => {
  try {
    return await gemini.generateContent(prompt);
  } catch (err) {
    if (retries === 0) throw err;
    console.warn(`API call failed, retrying in ${delay}ms...`, err);
    await new Promise((res) => setTimeout(res, delay));
    return callGeminiWithRetry(prompt, retries - 1, delay * 2);
  }
};
  
  // ---- SEND MESSAGE FUNCTION ----
const handleSend = async () => {
  const msg = input.trim();
  if (!msg) return;

  setMessages((prev) => [...prev, { text: msg, sender: "user" }]);
  setInput("");

  setLoading(true);

  try {
    if (match?.solution) {
      const improvePrompt = `
You are a semiconductor equipment support expert. The following solution was submitted by a knowledgeable Equipment Engineer and is correct.

Your task is to refine this solution to enhance:
- Clarity and readability without changing the technical meaning.
- Professional tone suitable for an engineering audience.
- Precise and consistent use of technical terminology.
- Formatting that makes it easy to understand and reference, such as bullet points or numbered steps where appropriate.

Solution:
"${match.solution}"

Provide the improved solution only, preserving the original intent and correctness.
`;

      const improveResult = await callGeminiWithRetry(improvePrompt);
      const improvedText = improveResult.response.text().trim();

      setMessages((prev) => [
        ...prev.filter((m) => m.text !== "🤔 Thinking with AI..."),
        { text: `🛠 Improved user-submitted solution:\n${improvedText}`, sender: "bot" },
        { text: "🤔 Thinking with AI...", sender: "bot" },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { text: "🤔 Thinking with AI...", sender: "bot" },
      ]);
    }

    const aiPrompt = match
      ? `You are an AI assistant specializing in semiconductor equipment troubleshooting. The user asked:

"${msg}"

A correct solution was previously submitted by an Equipment Engineer:
"${match.solution}"

Rephrase and expand this solution to improve clarity, provide additional context, and ensure it’s technically accurate and professional. Your response should be helpful to other equipment or process engineers. Use Markdown formatting:
- **bold** for key technical terms
- *italics* for emphasis
- Bullet points for steps or structured lists`
      : `You are an expert in semiconductor troubleshooting. Respond clearly and concisely to the following query:

"${msg}"

Use Markdown formatting:
- **bold** for technical terms
- *italics* for emphasis
- Bullet points for clear step-by-step guidance`;

    const aiResult = await callGeminiWithRetry(aiPrompt);
    const aiText = aiResult.response.text().trim();

    setMessages((prev) => {
      const withoutThinking = prev.filter(
        (m) => m.text !== "🤔 Thinking with AI..."
      );
      return [
        ...withoutThinking,
        { text: `🤖 AI's response:\n${aiText}`, sender: "bot" },
        match ? { type: "feedback", key: match.text, sender: "bot" } : null,
      ].filter(Boolean);
    });

    if (!mute || inputFromVoice) {
      speak(aiText);
      setInputFromVoice(false);
    }

    setPendingFeedback(match?.text || null);
  } catch (err) {
    console.error("Gemini error:", err);
    setMessages((prev) => [
      ...prev.filter((m) => m.text !== "🤔 Thinking with AI..."),
      { text: "⚠️ AI is unavailable. Try again later.", sender: "bot" },
    ]);
  } finally {
    setLoading(false);
  }
};

  
  // --- LOGIN UI ---
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold text-center">Hello, Im Fixie your AI Troubleshooting Assistant</h1>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter your name"
            className="w-full border rounded p-2"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN CHAT UI ---
  return (
    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden mx-auto mt-4">
<ChatHeader onToggleProfile={() => setShowProfile(!showProfile)} />
{showProfile && <ProfileCard user={user} />}
<div className="flex justify-between items-center px-4 pt-2 text-sm text-gray-600">
  <span>👋 Hello, {user.name}! Points: {user.points}</span>
  <button onClick={handleLogout} className="text-red-500 underline">Logout</button>
</div>
<ChatMessages messages={messages} onFeedback={(vote) => {
  setPendingFeedback(null);
  setMessages(prev => [...prev, {
    text: vote === "yes" ? "Thanks for the feedback!" : "I'll try to do better!",
    sender: "bot"
  }]);
}} />
      <Suggestions suggestions={suggestions} onSelect={setInput} />
      <InputControls
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onVoice={startListening}
        mute={mute}
        setMute={setMute}
      />
    </div>
  );
};
export default App;
