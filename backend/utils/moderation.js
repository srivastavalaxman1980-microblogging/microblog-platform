// Hateful keywords list (expandable)
const HATEFUL_KEYWORDS = [
  // Racial/ethnic slurs – placeholder examples
  'racialslur1', 'racialslur2',
  // Hate speech patterns
  'hate speech', 'kill all', 'burn down',
  'white power', 'black power',
  // Add real words responsibly, or load from database
];

// Normalize text – lowercase, remove punctuation
const normalizeText = (text) => {
  return text.toLowerCase().replace(/[^\w\s]/g, '');
};

// Check content against keyword list
const containsHatefulContent = (text) => {
  const normalized = normalizeText(text);
  const matched = HATEFUL_KEYWORDS.filter(keyword =>
    normalized.includes(keyword.toLowerCase())
  );
  return { isHateful: matched.length > 0, matchedKeywords: matched };
};

const moderateContent = async (userId, contentType, content, ModerationLog) => {
  const { isHateful, matchedKeywords } = containsHatefulContent(content);
  if (isHateful) {
    // Log violation
    await ModerationLog.create({
      user_id: userId,
      content_type: contentType,
      content,
      matched_keywords: matchedKeywords,
      reason: 'Hateful content detected',
    });
    throw new Error('Content violates our community guidelines. Hate speech is not allowed.');
  }
  return true;
};

module.exports = { moderateContent };