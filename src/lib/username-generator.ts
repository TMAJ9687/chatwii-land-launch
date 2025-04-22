
// Username options
const adjectives = [
  'Happy', 'Brave', 'Clever', 'Swift', 'Lively', 'Jolly', 'Cool', 'Smart',
  'Funny', 'Quick', 'Bright', 'Wild', 'Noble', 'Calm', 'Proud', 'Bold'
];

const nouns = [
  'Mouse', 'Tiger', 'Eagle', 'Panda', 'Wolf', 'Fox', 'Rabbit', 'Bear',
  'Hawk', 'Deer', 'Lion', 'Duck', 'Horse', 'Whale', 'Snake', 'Dolphin'
];

export const generateRandomUsername = (): string => {
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 100);
  
  return `${randomAdj}${randomNoun}${randomNumber}`;
};
