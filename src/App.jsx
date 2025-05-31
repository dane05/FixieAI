import React, { useEffect, useState } from "react";
import { db, gemini } from "./firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { cleanMarkdown } from './utils/markdown';

import useVoiceRecognition from "./hooks/useVoiceRecognition";
import useSpeechSynthesis from "./hooks/useSpeechSynthesis";
import useFuseSearch from "./hooks/useFuseSearch";
import { getBadge } from "./utils/badge";

import ChatHeader from "./components/ChatHeader";
import ChatMessages from "./components/ChatMessages";
import InputControls from "./components/InputControls";
import Suggestions from "./components/Suggestions";
import ProfileCard from "./components/ProfileCard";
import Feedback from "./components/Feedback";

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

    if (match) {
      let combinedResponse = "";

      if (match.solution) {
        combinedResponse += `👤 User-submitted solution:\n${match.solution}\n\n`;
      }

      try {
        const result = await gemini.generateContent(
          `You are a helpful assistant in the semiconductor industry. Reply in plain text only. The user asked: "${msg}". Here is a related user-submitted solution (if any): "${match.solution || 'N/A'}".`
        );

        let aiText = result.response.text();
        // aiText = await cleanMarkdown(aiText); // Uncomment if needed

        combinedResponse += `🤖 AI perspective:\n${aiText}`;

        setMessages(prev => [...prev, { text: combinedResponse, sender: "bot" }]);
        if (!mute) speak(aiText, lang); // Optional: only speak AI part
      } catch (err) {
        console.error("Gemini error:", err);
        setMessages(prev => [...prev, { text: "⚠️ AI is unavailable. Try again later.", sender: "bot" }]);
      }

      setPendingFeedback(match.text);
    } else {
      // Gemini fallback when there's no user-submitted solution
      setMessages(prev => [...prev, { text: "Thinking with AI... 🤖", sender: "bot" }]);
      try {
        const result = await gemini.generateContent(
          `You are a helpful and technically knowledgeable assistant specialized in the semiconductor industry. Always reply in clear plain text without markdown. Assume the user works in or is asking about topics relevant to semiconductor technology. Query: "${msg}"`
        );

        let aiText = result.response.text();
        // aiText = await cleanMarkdown(aiText); // Optional

        setMessages(prev => [...prev, { text: aiText, sender: "bot" }]);
        if (!mute) speak(aiText, lang);
      } catch (err) {
        console.error("Gemini error:", err);
        setMessages(prev => [...prev, { text: "⚠️ AI is unavailable. Try again later.", sender: "bot" }]);
      }
    }

    const updated = { ...user, points: user.points + 5 };
    setUser(updated);
    localStorage.setItem(`user-${user.name}`, JSON.stringify(updated));
  };

  return (
    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <ChatHeader />
      <ChatMessages messages={messages} />
      <Suggestions suggestions={suggestions} onSelect={setInput} />
      <InputControls
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onVoice={startListening}
        mute={mute}
        setMute={setMute}
        lang={lang}
        setLang={setLang}
      />
      <div className="flex justify-between px-4 pb-2 text-sm">
        <button onClick={() => setMessages([])} className="text-red-500 underline">🗑 Clear History</button>
        <button onClick={() => setShowProfile(!showProfile)} className="text-blue-500 underline">
          {showProfile ? "Hide Profile" : "View Profile"}
        </button>
      </div>
      {showProfile && <ProfileCard user={user} />}
      {pendingFeedback && (
        <Feedback onFeedback={(vote) => {
          setPendingFeedback(null);
          setMessages(prev => [...prev, {
            text: vote === "yes" ? "Thanks for the feedback!" : "I'll try to do better!",
            sender: "bot"
          }]);
        }} />
      )}
    </div>
  );
};

export default App;
