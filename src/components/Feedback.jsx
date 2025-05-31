import { ThumbsUp, ThumbsDown } from "lucide-react";

const Feedback = ({ onFeedback }) => (
  <div className="mt-2 text-sm text-gray-700">
    <p className="mb-2 font-medium">🤔 Did this help?</p>
    <div className="flex gap-4 items-center text-gray-500">
      <button
        onClick={() => onFeedback("yes")}
        aria-label="Yes"
        className="hover:text-green-600 transition-colors"
      >
        <ThumbsUp className="w-5 h-5" />
      </button>
      <button
        onClick={() => onFeedback("no")}
        aria-label="No"
        className="hover:text-red-600 transition-colors"
      >
        <ThumbsDown className="w-5 h-5" />
      </button>
    </div>
  </div>
);

export default Feedback;
