import { useState } from "react";
import { doc, setDoc, updateDoc, getDoc, increment } from "firebase/firestore";
import { db, gemini } from "../firebase";
import { buildImprovePrompt, buildAiPrompt } from "../utils/geminiPrompts";

export const useChatbot = ({
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
}) => {
  const [loading, setLoading] = useState(false);

  const handleSend = async (
    input,
    setInput,
    inputFromVoice,
    setInputFromVoice,
    tempProblem,
    setTempProblem,
    teachMode,
    setTeachMode
  ) => {
    const msg = input.trim();
    if (!msg) return;

    const lower = msg.toLowerCase();
    setMessages((prev) => [...prev, { text: msg, sender: "user" }]);
    setInput("");

    // Handle clear command
    if (lower === "clear") {
      setMessages([]);
      return;
    }

    // Start teaching mode
    if (lower === "solution") {
      setTeachMode(true);
      setTempProblem("");
      setMessages((prev) => [
        ...prev,
        { text: "Sure! Tell me the problem.", sender: "bot" },
      ]);
      return;
    }

    // Teaching mode, first step: get problem
    if (teachMode && !tempProblem) {
      setTempProblem(msg);
      setMessages((prev) => [
        ...prev,
        { text: "Thanks! Now give me the solution.", sender: "bot" },
      ]);
      return;
    }

    // Teaching mode, second step: get solution and save
    if (teachMode && tempProblem) {
      const knowledge = {
        solution: msg,
        submittedBy: user.name,
        confidence: 50,
        success: 0,
        failure: 0,
      };

      await setDoc(doc(db, "chatbotKnowledge", tempProblem.toLowerCase()), knowledge);

      setMessages((prev) => [
        ...prev,
        { text: `✅ Learned how to solve "${tempProblem}"!`, sender: "bot" },
      ]);

      if (!mute) speak(`Got it. I’ve learned how to fix ${tempProblem}.`);

      // Reload FAQ to update knowledge base
      const snap = await getDoc(doc(db, "users", user.name)); // reload user points after update
      setUser(snap.data());

      // Add points
      const userDocRef = doc(db, "users", user.name);
      await updateDoc(userDocRef, { points: increment(5) });
      const updatedSnap = await getDoc(userDocRef);
      setUser(updatedSnap.data());

      setTeachMode(false);
      setTempProblem("");
      return;
    }

    // Normal query flow
    const match = search(msg)[0];

    setLoading(true);

    try {
      if (match?.solution) {
        const improvePrompt = buildImprovePrompt(match.solution);

        const improveResult = await gemini.generateContent(improvePrompt);
        const improvedText = improveResult.response.text().trim();

        setMessages((prev) => [
          ...prev,
          { text: `🛠 Improved user-submitted solution:\n${improvedText}`, sender: "bot" },
          { text: "🤔 Thinking with AI...", sender: "bot" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: "🤔 Thinking with AI...", sender: "bot" },
        ]);
      }

      const aiPrompt = buildAiPrompt(msg, match);

      const aiResult = await gemini.generateContent(aiPrompt);
      const aiText = aiResult.response.text().trim();

      setMessages((prev) => {
        const withoutThinking = prev.filter((m) => m.text !== "🤔 Thinking with AI...");
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

  return { handleSend, loading };
};
