import { badgeLevels, getBadge } from "../utils/badge";

const ProfileCard = ({ user }) => {
  const badge = getBadge(user.points || 0);
  const next = badgeLevels.find((b) => b.points > (user.points || 0));

  return (
    <div className="bg-white p-4 border rounded-lg shadow-lg mt-2 mx-4">
      <h2 className="text-xl font-bold mb-2">🏆 {user.name}'s Profile</h2>
      <p>Points: <strong>{user.points}</strong></p>
      <p>Current Badge: <strong>{badge}</strong></p>
      {next ? (
        <p className="text-sm mt-2">🎯 {next.points - user.points} points to <b>{next.title}</b></p>
      ) : (
        <p className="text-sm mt-2 text-green-600">🎉 You've reached the highest badge!</p>
      )}
      <div className="mt-4">
        <p className="font-medium">Badge Levels:</p>
        <ul className="list-disc ml-5 text-sm">
          {badgeLevels.map((b) => (
            <li key={b.title}>{b.title}: {b.points} points</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProfileCard;
