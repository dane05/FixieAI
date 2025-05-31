import { Send, Mic, Volume2, VolumeX } from "lucide-react";

const InputControls = ({ input, setInput, onSend, onVoice, mute, setMute }) => (
  <div className="p-3 flex flex-col gap-2 border-t bg-white">
    <div className="flex items-center gap-3">
      <textarea
        className="flex-1 p-3 rounded border border-gray-300 bg-gray-100 resize-none h-12 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe your issue..."
      />
      
      <button
        onClick={onSend}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow transition flex items-center justify-center"
        aria-label="Send message"
      >
        <Send size={20} />
      </button>

      <button
        onClick={onVoice}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow transition flex items-center justify-center"
        aria-label="Voice input"
      >
        <Mic size={15} />
      </button>

      <button
        onClick={() => setMute(!mute)}
        className="bg-gray-200 hover:bg-gray-300 text-gray-800 p-3 rounded-full shadow transition flex items-center justify-center"
        aria-label={mute ? "Unmute" : "Mute"}
      >
        {mute ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>
    </div>
  </div>
);

export default InputControls;
