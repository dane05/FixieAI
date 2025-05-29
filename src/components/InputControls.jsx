const InputControls = ({ input, setInput, onSend, onVoice, mute, setMute, lang, setLang }) => (
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
    </div>
    <div className="flex justify-between items-center text-sm text-gray-700 px-2">
      <button onClick={() => setMute(!mute)}>{mute ? "🔇 Unmute" : "🔊 Mute"}</button>
      <select value={lang} onChange={(e) => setLang(e.target.value)} className="text-sm border rounded p-1">
        <option value="en-US">English</option>
        <option value="es-ES">Español</option>
        <option value="fr-FR">Français</option>
      </select>
    </div>
  </div>
);

export default InputControls;
