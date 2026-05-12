const { BlacklistEntry } = require('../models');

// -------------------------
// Built‑in profanity list (expandable)
// -------------------------
const PROFANITY_LIST = [
  'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'damn', 'bastard',
  'dick', 'pussy', 'cock', 'whore', 'slut', 'motherfucker',
  // Add more as needed
];

// -------------------------
// NSFW keywords (sexual, explicit)
// -------------------------
const NSFW_KEYWORDS = [
  'porn', 'xxx', 'nude', 'naked', 'sex', 'fuck', 'orgy', 'blowjob',
  'penis', 'vagina', 'boobs', 'breasts', 'nipple', 'erotic',
  // Add more as needed
];

// -------------------------
// Normalize text for matching
// -------------------------
const normalize = (text) => {
  return text.toLowerCase().replace(/[^\w\s]/g, '');
};

// -------------------------
// Check profanity
// -------------------------
const containsProfanity = (text) => {
  const normalized = normalize(text);
  return PROFANITY_LIST.some(word => normalized.includes(word));
};

// -------------------------
// Check NSFW content
// -------------------------
const containsNSFW = (text) => {
  const normalized = normalize(text);
  return NSFW_KEYWORDS.some(word => normalized.includes(word));
};

// -------------------------
// Check custom blacklist (from database)
// -------------------------
let cachedBlacklist = [];
let lastFetch = 0;
const CACHE_TTL = 60000; // 1 minute

const refreshBlacklist = async () => {
  if (Date.now() - lastFetch > CACHE_TTL) {
    const entries = await BlacklistEntry.findAll({ attributes: ['keyword'] });
    cachedBlacklist = entries.map(e => e.keyword.toLowerCase());
    lastFetch = Date.now();
  }
  return cachedBlacklist;
};

const containsCustomBlacklisted = async (text) => {
  const blacklist = await refreshBlacklist();
  const normalized = normalize(text);
  return blacklist.some(keyword => normalized.includes(keyword));
};

// -------------------------
// Main filter function
// -------------------------
const filterContent = async (text) => {
  const profanity = containsProfanity(text);
  if (profanity) {
    return { isViolation: true, reason: 'Profanity detected' };
  }
  const nsfw = containsNSFW(text);
  if (nsfw) {
    return { isViolation: true, reason: 'NSFW content detected' };
  }
  const custom = await containsCustomBlacklisted(text);
  if (custom) {
    return { isViolation: true, reason: 'Custom blacklisted keyword detected' };
  }
  return { isViolation: false };
};

// -------------------------
// Admin functions to manage blacklist
// -------------------------
const addBlacklistKeyword = async (keyword, category, userId) => {
  const normalized = keyword.trim().toLowerCase();
  await BlacklistEntry.create({
    keyword: normalized,
    category,
    created_by: userId,
  });
  // Invalidate cache
  lastFetch = 0;
  return true;
};

const removeBlacklistKeyword = async (keyword) => {
  const normalized = keyword.trim().toLowerCase();
  await BlacklistEntry.destroy({ where: { keyword: normalized } });
  lastFetch = 0;
  return true;
};

const listBlacklistKeywords = async () => {
  await refreshBlacklist();
  return cachedBlacklist;
};

module.exports = {
  filterContent,
  addBlacklistKeyword,
  removeBlacklistKeyword,
  listBlacklistKeywords,
};