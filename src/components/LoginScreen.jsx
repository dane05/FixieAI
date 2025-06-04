import React from "react";

const LoginScreen = ({ nameInput, setNameInput, handleLogin }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
    <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm space-y-4">
      <h1 className="text-xl font-bold text-center">
        Hello, I'm Fixie your AI Troubleshooting Assistant
      </h1>
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

export default LoginScreen;
