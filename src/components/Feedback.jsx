const Feedback = ({ onFeedback }) => (
  <div className="mt-2 px-4 text-sm text-gray-700">
    <p className="mb-1">🤔 Did this help?</p>
    <div className="flex gap-3 justify-start text-lg">
      <button onClick={() => onFeedback("yes")} className="hover:text-green-600">👍</button>
      <button onClick={() => onFeedback("no")} className="hover:text-red-600">👎</button>
    </div>
  </div>
);

export default Feedback;
