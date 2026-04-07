// Profanity filter for client-side message filtering
const PROFANITY_WORDS = new Set([
  'damn', 'hell', 'shit', 'fuck', 'ass', 'bitch', 'bastard', 'crap',
  'piss', 'dick', 'cock', 'pussy', 'slut', 'whore', 'fag', 'nigger',
  'retard', 'idiot', 'moron', 'stupid', 'dumb', 'loser', 'motherfucker',
  'asshole', 'wtf', 'stfu', 'bullshit'
]);

export const filterProfanity = (text) => {
  if (!text) return text;
  
  const words = text.split(/(\s+)/); // Split but keep spaces
  const filtered = words.map(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (PROFANITY_WORDS.has(cleanWord)) {
      return '*'.repeat(word.length);
    }
    return word;
  });
  
  return filtered.join('');
};

export const containsProfanity = (text) => {
  if (!text) return false;
  
  const words = text.toLowerCase().split(/\s+/);
  return words.some(word => {
    const cleanWord = word.replace(/[^a-z]/g, '');
    return PROFANITY_WORDS.has(cleanWord);
  });
};
