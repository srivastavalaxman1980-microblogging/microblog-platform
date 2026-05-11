const { detectCategory } = require('./moderationCategories');

const moderateContent = async (userId, contentType, content, ModerationLog) => {
  const { category, matchedKeywords } = detectCategory(content);
  if (category) {
    // Log violation with category
    await ModerationLog.create({
      user_id: userId,
      content_type: contentType,
      content,
      matched_keywords: matchedKeywords,
      category,
      reason: `Hateful content detected: ${category}`,
    });
    // Throw error with category for user feedback
    throw new Error(`Your ${contentType} contains hateful content (${category}). Please review our community guidelines.`);
  }
  return true;
};

module.exports = { moderateContent };