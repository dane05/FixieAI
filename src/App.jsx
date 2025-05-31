import React, { useEffect, useState } from "react";
import { db, gemini } from "./firebase";
import { collection, getDocs, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

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
  const [user, setUser] = useState(null); // {name, points}
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
  const [nameInput, setNameInput] = useState("");

  const { speak } = useSpeechSynthesis();
  const { startListening } = useVoiceRecognition((transcript) => {
    setInput(transcript);
    setTimeout(handleSend, 100);
  });

  const search = useFuseSearch(faq);

  // Load knowledge base and suggestions once
  useEffect(() => {
    const loadKnowledge = async () => {
      const snap = await getDocs(collection(db, "chatbotKnowledge"));
      const data = snap.docs.map(doc => ({ text: doc.id, ...doc.data() }));
      setFaq(data);
      setSuggestions(data.map(d => d.text).slice(0, 4));
    };
    loadKnowledge();
  }, []);

  // Load user messages after login
  useEffect(() => {
    if (!user) return;
    const loadMessages = async () => {
      const saved = localStorage.getItem(`chat-${user.name}`);
      if (saved) setMessages(JSON.parse(saved));
      else setMessages([]);
    };
    loadMessages();
  }, [user]);

  // Save messages on change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`chat-${user.name}`, JSON.stringify(messages));
    }
  }, [messages, user]);

  // Save user points to Firebase on user change
  useEffect(() => {
    if (!user) return;
    const savePoints = async () => {
      const userRef = doc(db, "users", user.name);
      await setDoc(userRef, { points: user.points }, { merge: true });
    };
    savePoints();
  }, [user?.points]);

  // Login handler (fetch user points from Firebase or create new)
  const handleLogin = async (e) => {
    e.preventDefault();
    const nameTrimmed = nameInput.trim();
    if (!nameTrimmed) return;

    const userRef = doc(db, "users", nameTrimmed);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      setUser({ name: nameTrimmed, points: data.points || 0 });
    } else {
      // New user
      await setDoc(userRef, { points: 0 });
      setUser({ name: nameTrimmed, points: 0 });
    }
    setNameInput("");
  };

  const handleLogout = () => {
    setUser(null);
    setMessages([]);
    setTeachMode(false);
    setTempProblem("");
    setPendingFeedback(null);
  };

  // Add points helper
  const addPoints = async (pointsToAdd) => {
    if (!user) return;
    const updated = { ...user, points: user.points + pointsToAdd };
    setUser(updated);
    const userRef = doc(db, "users", user.name);
    await updateDoc(userRef, { points: updated.points });
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

      // Add 5 points for submitting solution
      await addPoints(5);

      setTeachMode(false);
      setTempProblem("");
      return;
    }

    // Always show Thinking message
    setMessages(prev => [...prev, { text: "Thinking with AI... 🤖", sender: "bot" }]);
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

        // Remove Thinking message
        setMessages(prev => prev.filter(m => m.text !== "Thinking with AI... 🤖"));

        setMessages(prev => [...prev, { text: combinedResponse, sender: "bot" }]);
        if (!mute) speak(aiText);

        setPendingFeedback(match.text);
      } else {
        const result = await gemini.generateContent(
          `You are a helpful and technically knowledgeable assistant specialized in the semiconductor industry. 
Always reply in clear plain text without markdown. 
Assume the user works in or is asking about topics relevant to semiconductor technology. 
Query: "${msg}"`
        );

        const aiText = result.response.text().trim();

        // Remove Thinking message
        setMessages(prev => prev.filter(m => m.text !== "Thinking with AI... 🤖"));

        setMessages(prev => [...prev, { text: aiText, sender: "bot" }]);
        if (!mute) speak(aiText);

        setPendingFeedback(null);
      }
    } catch (err) {
      console.error("Gemini error:", err);
      setMessages(prev => {
        const filtered = prev.filter(m => m.text !== "Thinking with AI... 🤖");
        return [...filtered, { text: "⚠️ AI is unavailable. Try again later.", sender: "bot" }];
      });
      setPendingFeedback(null);
    } finally {
      setLoadingAI(false);
    }
  };

  // Handle feedback votes, +1 point to solution submitter if "yes"
  const handleFeedback = async (vote) => {
    if (!pendingFeedback) return;
    setPendingFeedback(null);

    if (vote === "yes") {
      setMessages(prev => [...prev, { text: "Thanks for the feedback!", sender: "bot" }]);
      try {
        const solDoc = doc(db, "chatbotKnowledge", pendingFeedback.toLowerCase());
        const solSnap = await getDoc(solDoc);
        if (solSnap.exists()) {
          const solData = solSnap.data();
          if (solData.submittedBy) {
            const submitterRef = doc(db, "users", solData.submittedBy);
            const submitterSnap = await getDoc(submitterRef);
            if (submitterSnap.exists()) {
              const submitterData = submitterSnap.data();
              const newPoints = (submitterData.points || 0) + 1;
              await updateDoc(submitterRef, { points: newPoints });

              // If the submitter is the current user, update local state points
              if (user.name === solData.submittedBy) {
                setUser(prev => ({ ...prev, points: newPoints }));
              }
            }
          }
          // Increment success count on solution
          await updateDoc(solDoc, { success: (solData.success || 0) + 1 });
        }
      } catch (err) {
        console.error("Feedback update error:", err);
      }
    } else {
      setMessages(prev => [...prev, { text: "Thanks for your feedback!", sender: "bot" }]);
    }
  };

  // Render login form if no user
  if (!user) {
    return (
      <div className="login-container" style={{ padding: 20, maxWidth: 400, margin: "auto" }}>
        <h2>Enter your name to start</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Your name"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            required
            autoFocus
            style={{ width: "100%", padding: 8, fontSize: 16 }}
          />
          <button type="submit" style={{ marginTop: 10, width: "100%", padding: 10 }}>
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Hello, {user.name} 👋 (Points: {user.points})</h2>
        <button onClick={handleLogout} style={{ padding: "6px 12px" }}>
          Logout
        </button>
      </header>

      <ChatMessages messages={messages} />

      {pendingFeedback && (
        <Feedback onVote={handleFeedback} />
      )}

      <InputControls
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onVoice={startListening}
        mute={mute}
        setMute={setMute}
        disabled={loadingAI || teachMode}
      />

      {teachMode && (
        <div style={{ marginTop: 15, fontStyle: "italic", color: "#555" }}>
          Teaching mode active — please provide problem & solution.
        </div>
      )}

      {suggestions.length > 0 && (
        <Suggestions suggestions={suggestions} onSelect={setInput} />
      )}

      {showProfile && (
        <ProfileCard user={user} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default App;
