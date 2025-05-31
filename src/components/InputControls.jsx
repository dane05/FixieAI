import { Send, Mic, Volume2, VolumeX } from "lucide-react";

const InputControls = ({ input, setInput, onSend, onVoice, mute, setMute }) => (
  <div className="p-3 flex flex-col gap-2 border-t bg-white">
    <div className="relative w-full">
      <textarea
        className="w-full p-3 pr-14 pb-16 rounded border border-gray-300 bg-gray-100 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe your issue..."
      />
      
      <div className="absolute bottom-2 right-2 flex gap-2">
        <button
          onClick={onSend}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow transition flex items-center justify-center"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>

        <button
          onClick={onVoice}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow transition flex items-center justify-center"
          aria-label="Voice input"
        >
          <Mic size={16} />
        </button>

        <button
          onClick={() => setMute(!mute)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-full shadow transition flex items-center justify-center"
          aria-label={mute ? "Unmute" : "Mute"}
        >
          {mute ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </div>
  </div>
);

export default InputControls;
