import React, { useEffect, useState } from "react";
import { db, gemini } from "./firebase";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";

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
  const [user, setUser] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [faq, setFaq] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [teachMode, setTeachMode] = useState(false);
  const [tempProblem, setTempProblem] = useState("");
  const [mute, setMute] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const { speak } = useSpeechSynthesis();
  const { startListening } = useVoiceRecognition((transcript) => {
    setInput(transcript);
    setTimeout(handleSend, 100);
  });

  const search = useFuseSearch(faq);

  // Load FAQ knowledge from Firestore
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "chatbotKnowledge"));
      const data = snap.docs.map(doc => ({ text: doc.id, ...doc.data() }));
      setFaq(data);
      setSuggestions(data.map(d => d.text).slice(0, 4));
    };
    load();
  }, []);

  // Load chat messages when user changes
  useEffect(() => {
    if (user?.name) {
      (async () => {
        const saved = JSON.parse(localStorage.getItem(`chat-${user.name}`));
        if (saved) setMessages(saved);
      })();
    }
  }, [user?.name]);

  // Save messages locally for quick load (optional)
  useEffect(() => {
    if (user?.name) {
      localStorage.setItem(`chat-${user.name}`, JSON.stringify(messages));
    }
  }, [messages, user?.name]);

  // Login form
  if (!user) {
    return <LoginForm onLogin={async (name) => {
      if (!name) return;
      // Fetch user data from firebase or create new
      const userRef = doc(db, "users", name);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUser({ name, points: userSnap.data().points || 0 });
      } else {
        // Create new user document
        await setDoc(userRef, { points: 0 });
        setUser({ name, points: 0 });
      }
    }} />;
  }

  const handleLogout = () => {
    setUser(null);
    setMessages([]);
    setInput("");
    setTeachMode(false);
    setTempProblem("");
    setPendingFeedback(null);
  };

  const handleSend = async () => {
    if (!user) return;

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
      // User submits a new solution - add to Firestore and award 5 points
      const knowledge = {
        solution: msg,
        submittedBy: user.name,
        confidence: 50,
        success: 0,
        failure: 0
      };
      await setDoc(doc(db, "chatbotKnowledge", tempProblem.toLowerCase()), knowledge);

      setMessages(prev => [...prev, { text: `Learned how to solve "${tempProblem}"!`, sender: "bot" }]);
      if (!mute) speak(`Got it. I’ve learned how to fix ${tempProblem}.`);

      // Update user points (+5)
      const updatedUser = { ...user, points: user.points + 5 };
      setUser(updatedUser);
      await setDoc(doc(db, "users", user.name), { points: updatedUser.points }, { merge: true });

      setTeachMode(false);
      setTempProblem("");
      return;
    }

    setLoadingAI(true);

    const match = search(msg)[0];

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

        const result = await gemini.generateContent(
          `You are a helpful assistant in the semiconductor industry. The user asked: "${msg}". 
Here is a user-submitted solution to consider: "${match.solution || 'N/A'}".
Now provide your own professional and detailed response.`
        );

        const aiText = result.response.text().trim();
        combinedResponse += `🤖 AI's response:\n${aiText}`;

        setMessages(prev => [...prev, { text: combinedResponse, sender: "bot" }]);
        if (!mute) speak(aiText);

        setPendingFeedback(match.text);
      } else {
        setMessages(prev => [...prev, { text: "Thinking with AI... 🤖", sender: "bot" }]);
        const result = await gemini.generateContent(
          `You are a helpful and technically knowledgeable assistant specialized in the semiconductor industry. 
Always reply in clear plain text without markdown. 
Assume the user works in or is asking about topics relevant to semiconductor technology. 
Query: "${msg}"`
        );

        const aiText = result.response.text().trim();
        setMessages(prev => [...prev, { text: aiText, sender: "bot" }]);
        if (!mute) speak(aiText);
      }
    } catch (err) {
      console.error("Gemini error:", err);
      setMessages(prev => [...prev, { text: "⚠️ AI is unavailable. Try again later.", sender: "bot" }]);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <ChatHeader />
      <ChatMessages messages={messages} loadingAI={loadingAI} />
      <Suggestions suggestions={suggestions} onSelect={setInput} />
      <InputControls
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onVoice={startListening}
        mute={mute}
        setMute={setMute}
      />
      <div className="flex justify-between px-4 pb-2 text-sm">
        <button onClick={() => setMessages([])} className="text-red-500 underline">🗑 Clear History</button>
        <button onClick={handleLogout} className="text-blue-500 underline">Logout</button>
        <button onClick={() => setShowProfile(!showProfile)} className="text-blue-500 underline">
          {showProfile ? "Hide Profile" : "View Profile"}
        </button>
      </div>
      {showProfile && <ProfileCard user={user} />}
      {pendingFeedback && (
        <Feedback
          onFeedback={async (vote) => {
            const problemKey = pendingFeedback;
            setPendingFeedback(null);

            setMessages(prev => [...prev, {
              text: vote === "yes" ? "Thanks for the feedback!" : "I'll try to do better!",
              sender: "bot"
            }]);

            if (vote === "yes") {
              try {
                const knowledgeDoc = await getDoc(doc(db, "chatbotKnowledge", problemKey.toLowerCase()));
                if (knowledgeDoc.exists()) {
                  const knowledgeData = knowledgeDoc.data();
                  if (knowledgeData.submittedBy) {
                    const userRef = doc(db, "users", knowledgeData.submittedBy);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                      const submitterData = userSnap.data();
                      const newPoints = (submitterData.points || 0) + 1;
                      await setDoc(userRef, { points: newPoints }, { merge: true });

                      if (knowledgeData.submittedBy === user?.name) {
                        setUser(prev => ({ ...prev, points: newPoints }));
                      }
                    }
                  }
                }
              } catch (error) {
                console.error("Error awarding points on feedback:", error);
              }
            }
          }}
        />
      )}
    </div>
  );
};

const LoginForm = ({ onLogin }) => {
  const [nameInput, setNameInput] = useState("");

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={e => {
          e.preventDefault();
          if (nameInput.trim()) onLogin(nameInput.trim());
        }}
        className="bg-white p-6 rounded shadow-md w-80"
      >
        <h2 className="text-xl font-semibold mb-4">Enter your name to start</h2>
        <input
          type="text"
          placeholder="Your name"
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          className="w-full p-2 border rounded mb-4"
          autoFocus
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Start Chat
        </button>
      </form>
    </div>
  );
};

export default App;
