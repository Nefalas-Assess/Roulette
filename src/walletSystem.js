// Wallet and token management system

export const WALLET_CONFIG = {
  INITIAL_TOKENS: 1000,
  HOURLY_TOKENS: 200,
  MAX_TOKENS: 9999999999,
  AD_REWARD_TOKENS: 500,
  HOUR_IN_MS: 60 * 60 * 1000, // 1 hour in milliseconds
  DAY_IN_MS: 24 * 60 * 60 * 1000 // 1 day in milliseconds
};

/**
 * Calculate how many tokens can be claimed based on time passed
 * @param {number} lastClaimTime - Timestamp of last token claim
 * @param {number} currentTokens - Current token count
 * @returns {Object} Object with claimableTokens and newClaimTime
 */
export function calculateClaimableTokens(lastClaimTime, currentTokens) {
  const now = Date.now();
  const timePassed = now - lastClaimTime;
  const hoursPassed = Math.floor(timePassed / WALLET_CONFIG.HOUR_IN_MS);
  
  if (hoursPassed < 1) {
    return { claimableTokens: 0, newClaimTime: lastClaimTime };
  }
  
  // Calculate maximum tokens that can be accumulated (24 hours worth)
  const maxAccumulatedTokens = WALLET_CONFIG.HOURLY_TOKENS * 24;
  const currentAccumulated = currentTokens - WALLET_CONFIG.INITIAL_TOKENS;
  
  // If already at max accumulated tokens, can't claim more
  if (currentAccumulated >= maxAccumulatedTokens) {
    return { claimableTokens: 0, newClaimTime: lastClaimTime };
  }
  
  // Calculate how many tokens can be claimed
  const potentialTokens = hoursPassed * WALLET_CONFIG.HOURLY_TOKENS;
  const remainingCapacity = maxAccumulatedTokens - currentAccumulated;
  const claimableTokens = Math.min(potentialTokens, remainingCapacity);
  
  // New claim time should be set to the current time
  const newClaimTime = now;
  
  return { claimableTokens, newClaimTime };
}

/**
 * Check if user can watch an ad for tokens
 * @param {Array} adWatchHistory - Array of ad watch timestamps
 * @returns {Object} Object with canWatch boolean
 */
export function canWatchAd(adWatchHistory = []) {
  // No daily limit - user can always watch ads
  return { canWatch: true, remainingWatches: 999, watchesToday: adWatchHistory.length };
}

/**
 * Process ad watch and return new token amount
 * @param {number} currentTokens - Current token count
 * @param {Array} adWatchHistory - Array of ad watch timestamps
 * @returns {Object} Object with success, newTokens, and newAdHistory
 */
export function processAdWatch(currentTokens, adWatchHistory = []) {
  // Always allow ad watching - no daily limits
  const newTokens = currentTokens + WALLET_CONFIG.AD_REWARD_TOKENS;
  const newAdHistory = [...adWatchHistory, Date.now()];
  
  return {
    success: true,
    newTokens,
    newAdHistory,
    message: `+${WALLET_CONFIG.AD_REWARD_TOKENS} tokens earned!`
  };
}

/**
 * Get time until next hourly token claim
 * @param {number} lastClaimTime - Timestamp of last token claim
 * @returns {Object} Object with timeUntilNext in milliseconds and formatted string
 */
export function getTimeUntilNextClaim(lastClaimTime) {
  const now = Date.now();
  const nextClaimTime = lastClaimTime + WALLET_CONFIG.HOUR_IN_MS;
  const timeUntilNext = Math.max(0, nextClaimTime - now);
  
  if (timeUntilNext === 0) {
    return { timeUntilNext: 0, formatted: 'Available now' };
  }
  
  const minutes = Math.ceil(timeUntilNext / (60 * 1000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  let formatted;
  if (hours > 0) {
    formatted = `${hours}h ${remainingMinutes}m`;
  } else {
    formatted = `${remainingMinutes}m`;
  }
  
  return { timeUntilNext, formatted };
}

/**
 * Validate token transaction (bet, win, etc.)
 * @param {number} currentTokens - Current token count
 * @param {number} amount - Amount to deduct/add
 * @param {string} type - Transaction type ('bet', 'win', 'claim', 'ad')
 * @returns {Object} Object with valid boolean and message
 */
export function validateTransaction(currentTokens, amount, type) {
  if (amount < 0) {
    return { valid: false, message: 'Invalid amount' };
  }
  
  switch (type) {
    case 'bet':
      if (currentTokens < amount) {
        return { valid: false, message: 'Insufficient tokens' };
      }
      if (amount === 0) {
        return { valid: false, message: 'Bet amount must be greater than 0' };
      }
      return { valid: true, message: 'Valid bet' };
      
    case 'win':
    case 'claim':
    case 'ad':
      return { valid: true, message: 'Valid transaction' };
      
    default:
      return { valid: false, message: 'Unknown transaction type' };
  }
}

/**
 * Format token amount for display
 * @param {number} tokens - Token amount
 * @returns {string} Formatted token string
 */
export function formatTokens(tokens) {
  if (tokens >= 1000000) {
    return (tokens / 1000000).toFixed(1) + 'M';
  }
  if (tokens >= 1000) {
    return (tokens / 1000).toFixed(1) + 'K';
  }
  return tokens.toLocaleString();
}

