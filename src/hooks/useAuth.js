import { useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const useAuth = (setUser, setMessages) => {
  const login = async (nameInput) => {
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
    setMessages([]);
  };

  const logout = () => {
    setUser(null);
    setMessages([]);
  };

  return { login, logout };
};
