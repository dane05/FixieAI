import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export const useFaq = () => {
  const [faq, setFaq] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const loadFaq = async () => {
    const snap = await getDocs(collection(db, "chatbotKnowledge"));
    const data = snap.docs.map((doc) => ({ text: doc.id, ...doc.data() }));
    setFaq(data);
    setSuggestions(data.map((d) => d.text).slice(0, 4));
  };

  useEffect(() => {
    loadFaq();
  }, []);

  return { faq, suggestions, reload: loadFaq };
};
