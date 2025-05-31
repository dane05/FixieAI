import { Send, Mic, Volume2, VolumeX } from "lucide-react";

const InputControls = ({ input, setInput, onSend, onVoice, mute, setMute }) => (
  <div className="p-3 flex flex-col gap-2 border-t bg-white">
    <div className="relative w-full">
      <textarea
        className="w-full p-4 pr-28 pb-20 rounded-xl border border-gray-300 bg-gray-100 resize-none h-28 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe your issue..."
      />

      {/* Controls inside textarea */}
      <div className="absolute bottom-3 right-3 flex gap-2">
        {/* Mute */}
        <button
          onClick={() => setMute(!mute)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 p-2.5 rounded-full shadow-sm transition flex items-center justify-center"
          aria-label={mute ? "Unmute" : "Mute"}
        >
          {mute ? <VolumeX size={10} /> : <Volume2 size={10} />}
        </button>

        {/* Voice */}
        <button
          onClick={onVoice}
          className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2.5 rounded-full shadow-sm transition flex items-center justify-center"
          aria-label="Voice input"
        >
          <Mic size={10} />
        </button>

        {/* Send */}
        <button
          onClick={onSend}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full shadow-md transition flex items-center justify-center"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  </div>
);

export default InputControls;
