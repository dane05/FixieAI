export const badgeLevels = [
  { title: "Newbie", points: 0 },
  { title: "Junior Fixer", points: 15 },
  { title: "Expert Fixer", points: 30 },
  { title: "Master Fixer", points: 50 },
];

export const getBadge = (points) => {
  for (let i = badgeLevels.length - 1; i >= 0; i--) {
    if (points >= badgeLevels[i].points) return badgeLevels[i].title;
  }
  return "Newbie";
};
