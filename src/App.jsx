import React, { useEffect, useState } from "react";
import { db, gemini } from "./firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

import useVoiceRecognition from "./hooks/useVoiceRecognition";
import useSpeechSynthesis from "./hooks/useSpeechSynthesis";
import useFuseSearch from "./hooks/useFuseSearch";

import ChatMessages from "./components/ChatMessages";
import Suggestions from "./components/Suggestions";
import Feedback from "./components/Feedback";
import ProfileCard from "./components/ProfileCard";

const App = () => {
  const [user, setUser] = useState({ name: "", points: 0 });
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [faq, setFaq] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [teachMode, setTeachMode] = useState(false);
  const [tempProblem, setTempProblem] = useState("");
  const [mute, setMute] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState(null);
  const [lang, setLang] = useState("en-US");
  const [isLoading, setIsLoading] = useState(false);

  const { speak } = useSpeechSynthesis();
  const { startListening } = useVoiceRecognition((transcript) => {
    setInput(transcript);
    setTimeout(handleSend, 100);
  });

  const search = useFuseSearch(faq);

  useEffect(() => {
    const name = prompt("What is your name?");
    if (name) {
      const saved = JSON.parse(localStorage.getItem(`user-${name}`)) || { name, points: 0 };
      setUser(saved);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "chatbotKnowledge"));
      const data = snap.docs.map(doc => ({ text: doc.id, ...doc.data() }));
      setFaq(data);
      setSuggestions(data.map(d => d.text).slice(0, 4));
    };
    load();
  }, []);

  useEffect(() => {
    if (user.name) {
      const saved = JSON.parse(localStorage.getItem(`chat-${user.name}`));
      if (saved) setMessages(saved);
    }
  }, [user.name]);

  useEffect(() => {
    if (user.name) {
      localStorage.setItem(`chat-${user.name}`, JSON.stringify(messages));
    }
  }, [messages]);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
  };

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg) return;
    const lower = msg.toLowerCase();
    setMessages(prev => [...prev, { text: msg, sender: "user" }]);
    setInput("");

    if (lower === "solution") {
      setTeachMode(true);
      setTempProblem("");
      setMessages(prev => [...prev, { text: "Sure! Tell me the problem.", sender: "bot" }]);
      return;
    }

    if (teachMode && !tempProblem) {
      setTempProblem(msg);
      setMessages(prev => [...prev, { text: "Thanks! Now give me the solution.", sender: "bot" }]);
      return;
    }

    if (teachMode && tempProblem) {
      const knowledge = {
        solution: msg,
        submittedBy: user.name,
        confidence: 50,
        success: 0,
        failure: 0
      };
      await setDoc(doc(db, "chatbotKnowledge", tempProblem.toLowerCase()), knowledge);
      setMessages(prev => [...prev, { text: `Learned how to solve "${tempProblem}"!`, sender: "bot" }]);
      if (!mute) speak(`Got it. I’ve learned how to fix ${tempProblem}.`, lang);
      setTeachMode(false);
      setTempProblem("");
      return;
    }

    const match = search(msg)[0];
    setIsLoading(true);
    try {
      if (match) {
        let improvedUserSolution = match.solution || "";
        let combinedResponse = "";

        if (match.solution) {
          const improvePrompt = `
You are an expert in semiconductor engineering.
Improve the following user-submitted solution for clarity, precision, and technical detail. 
Keep it concise, professional, and actionable:

"${match.solution}"

Respond with only the improved version.`;

          const improveResult = await gemini.generateContent(improvePrompt);
          improvedUserSolution = improveResult.response.text().trim();
          combinedResponse += `🛠 Improved user-submitted solution:\n${improvedUserSolution}\n\n`;
        }

        // AI’s independent response
        const result = await gemini.generateContent(
          `You are a helpful assistant in the semiconductor industry. The user asked: "${msg}". 
Here is a user-submitted solution to consider: "${match.solution || 'N/A'}".
Now provide your own professional and detailed response.`
        );

        const aiText = result.response.text().trim();
        combinedResponse += `🤖 AI:\n${aiText}`;
        setMessages(prev => [...prev, { text: combinedResponse, sender: "bot" }]);
        if (!mute) speak(aiText, lang);
        setPendingFeedback(match.text);
      } else {
        setMessages(prev => [...prev, { text: "Thinking with AI... 🤖", sender: "bot" }]);
        const result = await gemini.generateContent(
          `User asked: "${msg}". Provide a professional semiconductor-focused response.`
        );
        const aiText = result.response.text().trim();
        setMessages(prev => [...prev, { text: aiText, sender: "bot" }]);
        if (!mute) speak(aiText, lang);
      }

      const updated = { ...user, points: user.points + 5 };
      setUser(updated);
      localStorage.setItem(`user-${user.name}`, JSON.stringify(updated));
    } catch (err) {
      console.error("Gemini error:", err);
      setMessages(prev => [...prev, { text: "⚠️ AI is unavailable. Try again later.", sender: "bot" }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 text-black dark:text-white w-full h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b dark:border-gray-800">
        <div className="text-lg font-semibold">💬 SemiBot</div>
        <div className="flex items-center gap-2">
          <button onClick={toggleDarkMode} className="hover:text-yellow-500">🌓</button>
          <button onClick={() => setShowProfile(!showProfile)} className="hover:text-blue-400">
            🙍‍♂️
          </button>
        </div>
      </div>

      {/* Profile Dropdown */}
      {showProfile && (
        <div className="absolute top-14 right-4 z-10 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3">
          <ProfileCard user={user} />
        </div>
      )}

      {/* Teach Mode Banner */}
      {teachMode && (
        <div className="bg-yellow-100 dark:bg-yellow-300 text-yellow-800 text-center text-sm py-1">
          🧠 Teach Mode Active
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <ChatMessages messages={messages} />
        {isLoading && (
          <div className="text-sm text-gray-500">🔄 AI is processing...</div>
        )}
      </div>

      <Suggestions suggestions={suggestions} onSelect={setInput} />

      {/* Input Bar */}
      <div className="p-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            className="flex-1 px-4 py-2 rounded-lg border dark:border-gray-700 dark:bg-gray-900 focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me something..."
          />
          <button onClick={startListening} className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            🎙
          </button>
          <button onClick={() => setMute(!mute)} className="px-3 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg">
            {mute ? "🔇" : "🔊"}
          </button>
          <button onClick={handleSend} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            ➤
          </button>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex justify-between items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
        <button onClick={() => setMessages([])} className="hover:text-red-500">🗑 Clear</button>
      </div>

      {/* Feedback */}
      {pendingFeedback && (
        <Feedback
          onFeedback={(vote) => {
            setPendingFeedback(null);
            setMessages(prev => [...prev, {
              text: vote === "yes" ? "👍 Thanks for the feedback!" : "👎 I'll try to do better!",
              sender: "bot"
            }]);
          }}
        />
      )}
    </div>
  );
};

export default App;
