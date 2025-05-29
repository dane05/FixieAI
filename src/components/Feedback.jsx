const Feedback = ({ onFeedback }) => (
  <div className="flex gap-3 mt-2 justify-center text-lg">
    <button onClick={() => onFeedback("yes")} className="hover:text-green-600">👍</button>
    <button onClick={() => onFeedback("no")} className="hover:text-red-600">👎</button>
  </div>
);

export default Feedback;
