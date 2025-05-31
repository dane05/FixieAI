const InputControls = ({ input, setInput, onSend, onVoice, mute, setMute }) => (
  <div className="p-3 flex flex-col gap-2 border-t">
    <div className="flex items-center gap-2">
      <textarea
        className="flex-1 p-2 rounded-full border border-gray-300 bg-gray-100 resize-none h-12"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe your issue..."
      />
      <button onClick={onSend} className="bg-blue-500 text-white p-3 rounded-full shadow">➤</button>
      <button onClick={onVoice} className="bg-blue-500 text-white p-3 rounded-full shadow">🎤</button>
      <button onClick={() => setMute(!mute)} className="bg-gray-200 text-black p-3 rounded-full shadow">
        {mute ? "🔇" : "🔊"}
      </button>
    </div>
  </div>
);

export default InputControls;
