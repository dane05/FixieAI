const Suggestions = ({ suggestions, onSelect }) => (
  <div className="bg-slate-100 p-3 flex flex-wrap gap-2 border-t">
    {suggestions.map((s, i) => (
      <div key={i} className="bg-blue-100 hover:bg-blue-200 text-sm px-3 py-1 rounded-full cursor-pointer" onClick={() => onSelect(s)}>
        {s}
      </div>
    ))}
  </div>
);

export default Suggestions;
