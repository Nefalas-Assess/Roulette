// Advanced betting system for roulette game

/**
 * Available bet amounts
 */
export const BET_AMOUNTS = [1, 5, 10, 25, 50];

/**
 * Bet types and their payout ratios
 */
export const BET_TYPES = {
  STRAIGHT_UP: { name: 'Straight Up', payout: 35, description: 'Single number' },
  SPLIT: { name: 'Split', payout: 17, description: 'Two adjacent numbers' },
  STREET: { name: 'Street', payout: 11, description: 'Three numbers in a row' },
  CORNER: { name: 'Corner', payout: 8, description: 'Four numbers in a square' },
  FIVE_NUMBER: { name: 'Five Number', payout: 6, description: '0, 00, 1, 2, 3' },
  SIX_LINE: { name: 'Six Line', payout: 5, description: 'Six numbers in two rows' },
  COLUMN: { name: 'Column', payout: 2, description: 'Entire column' },
  DOZEN: { name: 'Dozen', payout: 2, description: '1st 12, 2nd 12, or 3rd 12' },
  RED: { name: 'Red', payout: 1, description: 'All red numbers' },
  BLACK: { name: 'Black', payout: 1, description: 'All black numbers' },
  EVEN: { name: 'Even', payout: 1, description: 'All even numbers' },
  ODD: { name: 'Odd', payout: 1, description: 'All odd numbers' },
  LOW: { name: '1-18', payout: 1, description: 'Numbers 1-18' },
  HIGH: { name: '19-36', payout: 1, description: 'Numbers 19-36' }
};

/**
 * Red and black number definitions
 */
export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

/**
 * Betting areas configuration for the roulette table
 */
export const BETTING_AREAS = {
  // Outside bets
  RED: { type: 'RED', numbers: RED_NUMBERS },
  BLACK: { type: 'BLACK', numbers: BLACK_NUMBERS },
  EVEN: { type: 'EVEN', numbers: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36] },
  ODD: { type: 'ODD', numbers: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35] },
  LOW: { type: 'LOW', numbers: Array.from({length: 18}, (_, i) => i + 1) },
  HIGH: { type: 'HIGH', numbers: Array.from({length: 18}, (_, i) => i + 19) },
  FIRST_DOZEN: { type: 'DOZEN', numbers: Array.from({length: 12}, (_, i) => i + 1) },
  SECOND_DOZEN: { type: 'DOZEN', numbers: Array.from({length: 12}, (_, i) => i + 13) },
  THIRD_DOZEN: { type: 'DOZEN', numbers: Array.from({length: 12}, (_, i) => i + 25) },
  FIRST_COLUMN: { type: 'COLUMN', numbers: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34] },
  SECOND_COLUMN: { type: 'COLUMN', numbers: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35] },
  THIRD_COLUMN: { type: 'COLUMN', numbers: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36] }
};

/**
 * Bet class to represent individual bets
 */
export class Bet {
  constructor(type, numbers, amount, area = null) {
    this.id = Date.now() + Math.random();
    this.type = type;
    this.numbers = Array.isArray(numbers) ? numbers : [numbers];
    this.amount = amount;
    this.area = area;
    this.timestamp = Date.now();
  }

  /**
   * Check if this bet wins for a given number
   * @param {number|string} winningNumber - The winning number
   * @returns {boolean} Whether this bet wins
   */
  isWinning(winningNumber) {
    // Handle string numbers like '00'
    const numStr = winningNumber.toString();
    const numInt = parseInt(winningNumber);
    
    return this.numbers.includes(winningNumber) || 
           this.numbers.includes(numStr) || 
           this.numbers.includes(numInt);
  }

  /**
   * Calculate winnings for this bet
   * @param {number|string} winningNumber - The winning number
   * @returns {number} Winnings amount (including original bet)
   */
  calculateWinnings(winningNumber) {
    if (!this.isWinning(winningNumber)) {
      return 0;
    }

    const betType = BET_TYPES[this.type];
    if (!betType) {
      return 0;
    }

    return this.amount * (betType.payout + 1); // +1 to include original bet
  }

  /**
   * Get display information for this bet
   * @returns {Object} Display information
   */
  getDisplayInfo() {
    const betType = BET_TYPES[this.type];
    let description = '';

    if (this.numbers.length === 1) {
      description = `${this.numbers[0]}`;
    } else if (this.numbers.length <= 3) {
      description = this.numbers.join(', ');
    } else {
      description = betType ? betType.description : 'Multiple numbers';
    }

    return {
      type: this.type,
      description,
      amount: this.amount,
      payout: betType ? `${betType.payout}:1` : '1:1'
    };
  }
}

/**
 * Betting manager class to handle multiple bets
 */
export class BettingManager {
  constructor() {
    this.bets = [];
    this.selectedBetAmount = BET_AMOUNTS[0]; // Default to 1
  }

  /**
   * Set the current bet amount
   * @param {number} amount - Bet amount to set
   */
  setBetAmount(amount) {
    if (BET_AMOUNTS.includes(amount)) {
      this.selectedBetAmount = amount;
    }
  }

  /**
   * Get current bet amount
   * @returns {number} Current bet amount
   */
  getBetAmount() {
    return this.selectedBetAmount;
  }

  /**
   * Add a new bet
   * @param {string} type - Bet type
   * @param {Array|number} numbers - Numbers to bet on
   * @param {number} amount - Bet amount (optional, uses selected amount)
   * @param {string} area - Betting area identifier (optional)
   * @returns {Bet} The created bet
   */
  addBet(type, numbers, amount = null, area = null) {
    const betAmount = amount || this.selectedBetAmount;
    const bet = new Bet(type, numbers, betAmount, area);
    this.bets.push(bet);
    return bet;
  }

  /**
   * Remove a bet by ID
   * @param {string} betId - ID of bet to remove
   */
  removeBet(betId) {
    this.bets = this.bets.filter(bet => bet.id !== betId);
  }

  /**
   * Clear all bets
   */
  clearAllBets() {
    this.bets = [];
  }

  /**
   * Get all current bets
   * @returns {Array} Array of current bets
   */
  getAllBets() {
    return [...this.bets];
  }

  /**
   * Get total bet amount
   * @returns {number} Total amount of all bets
   */
  getTotalBetAmount() {
    return this.bets.reduce((total, bet) => total + bet.amount, 0);
  }

  /**
   * Calculate total winnings for a winning number
   * @param {number|string} winningNumber - The winning number
   * @returns {Object} Winnings breakdown
   */
  calculateTotalWinnings(winningNumber) {
    let totalWinnings = 0;
    const winningBets = [];
    const losingBets = [];

    this.bets.forEach(bet => {
      const winnings = bet.calculateWinnings(winningNumber);
      if (winnings > 0) {
        totalWinnings += winnings;
        winningBets.push({
          bet,
          winnings,
          profit: winnings - bet.amount
        });
      } else {
        losingBets.push(bet);
      }
    });

    return {
      totalWinnings,
      totalBetAmount: this.getTotalBetAmount(),
      netProfit: totalWinnings - this.getTotalBetAmount(),
      winningBets,
      losingBets,
      winCount: winningBets.length,
      loseCount: losingBets.length
    };
  }

  /**
   * Get bets summary for display
   * @returns {Array} Array of bet summaries
   */
  getBetsSummary() {
    return this.bets.map(bet => ({
      id: bet.id,
      ...bet.getDisplayInfo(),
      timestamp: bet.timestamp
    }));
  }
}

/**
 * Helper function to determine if a number is red
 * @param {number|string} number - Number to check
 * @returns {boolean} Whether the number is red
 */
export function isRedNumber(number) {
  const num = parseInt(number);
  return RED_NUMBERS.includes(num);
}

/**
 * Helper function to determine if a number is black
 * @param {number|string} number - Number to check
 * @returns {boolean} Whether the number is black
 */
export function isBlackNumber(number) {
  const num = parseInt(number);
  return BLACK_NUMBERS.includes(num);
}

/**
 * Helper function to get number color
 * @param {number|string} number - Number to check
 * @returns {string} Color ('red', 'black', or 'green')
 */
export function getNumberColor(number) {
  if (number === 0 || number === '00') return 'green';
  if (isRedNumber(number)) return 'red';
  if (isBlackNumber(number)) return 'black';
  return 'green';
}

export { BettingManager, BET_TYPES, BET_AMOUNTS, PAYOUTS };