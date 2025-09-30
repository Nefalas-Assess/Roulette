// Advanced statistics engine for roulette game

/**
 * Calculate comprehensive player statistics
 * @param {Array} gameHistory - Array of game results
 * @param {Object} currentStats - Current statistics object
 * @returns {Object} Enhanced statistics object
 */
export function calculateAdvancedStats(gameHistory, currentStats) {
  if (gameHistory.length === 0) {
    return {
      ...currentStats,
      winRate: 0,
      averageBet: 0,
      averageWinning: 0,
      biggestWin: 0,
      longestWinStreak: 0,
      longestLoseStreak: 0,
      currentStreak: { type: 'none', count: 0 },
      profitLoss: 0,
      roi: 0
    };
  }

  // Calculate basic metrics
  const totalGames = gameHistory.length;
  const totalWins = gameHistory.filter(game => game.winnings > 0).length;
  const totalBetAmount = gameHistory.reduce((sum, game) => sum + game.bet, 0);
  const totalWinnings = gameHistory.reduce((sum, game) => sum + game.winnings, 0);
  
  const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
  const averageBet = totalGames > 0 ? totalBetAmount / totalGames : 0;
  const averageWinning = totalWins > 0 ? totalWinnings / totalWins : 0;
  const biggestWin = Math.max(...gameHistory.map(game => game.winnings), 0);
  const profitLoss = totalWinnings - totalBetAmount;
  const roi = totalBetAmount > 0 ? (profitLoss / totalBetAmount) * 100 : 0;

  // Calculate streaks
  const streaks = calculateStreaks(gameHistory);
  
  return {
    totalGames,
    totalWins,
    totalBetAmount,
    totalWinnings,
    winRate: Math.round(winRate * 100) / 100,
    averageBet: Math.round(averageBet),
    averageWinning: Math.round(averageWinning),
    biggestWin,
    longestWinStreak: streaks.longestWinStreak,
    longestLoseStreak: streaks.longestLoseStreak,
    currentStreak: streaks.currentStreak,
    profitLoss,
    roi: Math.round(roi * 100) / 100
  };
}

/**
 * Calculate win/lose streaks from game history
 * @param {Array} gameHistory - Array of game results (newest first)
 * @returns {Object} Streak information
 */
function calculateStreaks(gameHistory) {
  if (gameHistory.length === 0) {
    return {
      longestWinStreak: 0,
      longestLoseStreak: 0,
      currentStreak: { type: 'none', count: 0 }
    };
  }

  let longestWinStreak = 0;
  let longestLoseStreak = 0;
  let currentWinStreak = 0;
  let currentLoseStreak = 0;
  
  // Process games from oldest to newest
  const reversedHistory = [...gameHistory].reverse();
  
  for (const game of reversedHistory) {
    if (game.winnings > 0) {
      currentWinStreak++;
      currentLoseStreak = 0;
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    } else {
      currentLoseStreak++;
      currentWinStreak = 0;
      longestLoseStreak = Math.max(longestLoseStreak, currentLoseStreak);
    }
  }
  
  // Current streak is based on the most recent game
  const currentStreak = currentWinStreak > 0 
    ? { type: 'win', count: currentWinStreak }
    : currentLoseStreak > 0 
      ? { type: 'lose', count: currentLoseStreak }
      : { type: 'none', count: 0 };

  return {
    longestWinStreak,
    longestLoseStreak,
    currentStreak
  };
}

/**
 * Analyze number frequency and patterns
 * @param {Array} gameHistory - Array of game results
 * @param {number} sampleSize - Number of recent games to analyze
 * @returns {Object} Number analysis data
 */
export function analyzeNumberPatterns(gameHistory, sampleSize = 100) {
  if (gameHistory.length === 0) {
    return {
      hotNumbers: [7, 23, 17, 32, 11],
      coldNumbers: [13, 6, 34, 2, 29],
      numberFrequency: {},
      colorDistribution: { red: 0, black: 0, green: 0 },
      evenOddDistribution: { even: 0, odd: 0, zero: 0 }
    };
  }

  const recentGames = gameHistory.slice(0, Math.min(sampleSize, gameHistory.length));
  const numberFrequency = {};
  const colorDistribution = { red: 0, black: 0, green: 0 };
  const evenOddDistribution = { even: 0, odd: 0, zero: 0 };

  // Initialize frequency count for all numbers
  for (let i = 0; i <= 36; i++) {
    numberFrequency[i] = 0;
  }
  numberFrequency['00'] = 0;

  // Count occurrences and distributions
  recentGames.forEach(game => {
    const num = game.winningNumber;
    if (numberFrequency.hasOwnProperty(num)) {
      numberFrequency[num]++;
    }

    // Color distribution
    if (num === 0 || num === '00') {
      colorDistribution.green++;
      evenOddDistribution.zero++;
    } else {
      const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      if (redNumbers.includes(num)) {
        colorDistribution.red++;
      } else {
        colorDistribution.black++;
      }

      // Even/Odd distribution
      if (num % 2 === 0) {
        evenOddDistribution.even++;
      } else {
        evenOddDistribution.odd++;
      }
    }
  });

  // Sort numbers by frequency
  const sortedNumbers = Object.entries(numberFrequency)
    .map(([num, freq]) => ({ 
      number: num === '00' ? '00' : parseInt(num), 
      frequency: freq 
    }))
    .sort((a, b) => b.frequency - a.frequency);

  // Get hot and cold numbers
  const hotNumbers = sortedNumbers.slice(0, 5).map(item => item.number);
  const coldNumbers = sortedNumbers.slice(-5).map(item => item.number);

  return {
    hotNumbers,
    coldNumbers,
    numberFrequency,
    colorDistribution,
    evenOddDistribution
  };
}

/**
 * Generate performance chart data
 * @param {Array} gameHistory - Array of game results (newest first)
 * @param {number} maxPoints - Maximum number of data points
 * @returns {Array} Chart data points
 */
export function generatePerformanceChart(gameHistory, maxPoints = 20) {
  if (gameHistory.length === 0) {
    return [];
  }

  const recentGames = gameHistory.slice(0, maxPoints).reverse();
  let runningBalance = 0;
  
  return recentGames.map((game, index) => {
    runningBalance += (game.winnings - game.bet);
    return {
      game: index + 1,
      balance: runningBalance,
      win: game.winnings > 0
    };
  });
}

/**
 * Calculate betting patterns and recommendations
 * @param {Array} gameHistory - Array of game results
 * @returns {Object} Betting analysis and recommendations
 */
export function analyzeBettingPatterns(gameHistory) {
  if (gameHistory.length < 10) {
    return {
      averageBetSize: 0,
      bettingSizeVariation: 'stable',
      recommendation: 'Play more games to get meaningful insights',
      riskLevel: 'unknown'
    };
  }

  const betAmounts = gameHistory.map(game => game.bet);
  const averageBetSize = betAmounts.reduce((sum, bet) => sum + bet, 0) / betAmounts.length;
  
  // Calculate standard deviation of bet sizes
  const variance = betAmounts.reduce((sum, bet) => sum + Math.pow(bet - averageBetSize, 2), 0) / betAmounts.length;
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = standardDeviation / averageBetSize;

  let bettingSizeVariation;
  if (coefficientOfVariation < 0.1) {
    bettingSizeVariation = 'very stable';
  } else if (coefficientOfVariation < 0.3) {
    bettingSizeVariation = 'stable';
  } else if (coefficientOfVariation < 0.5) {
    bettingSizeVariation = 'moderate';
  } else {
    bettingSizeVariation = 'highly variable';
  }

  // Risk level assessment
  const maxBet = Math.max(...betAmounts);
  const minBet = Math.min(...betAmounts);
  const betRange = maxBet - minBet;
  
  let riskLevel;
  if (maxBet <= 100) {
    riskLevel = 'conservative';
  } else if (maxBet <= 500) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'aggressive';
  }

  // Generate recommendation
  const winRate = gameHistory.filter(game => game.winnings > 0).length / gameHistory.length;
  let recommendation;
  
  if (winRate > 0.4) {
    recommendation = 'Your win rate is good! Consider maintaining your current strategy.';
  } else if (winRate > 0.2) {
    recommendation = 'Your win rate is average. Consider adjusting your betting strategy.';
  } else {
    recommendation = 'Your win rate is low. Consider taking a break or reducing bet sizes.';
  }

  return {
    averageBetSize: Math.round(averageBetSize),
    bettingSizeVariation,
    recommendation,
    riskLevel,
    maxBet,
    minBet,
    betRange
  };
}

