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
    THIRD_COLUMN: { type: 'COLUMN', numbers: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36] },

    // Inside bets (single numbers)
    '0': { type: 'STRAIGHT_UP', numbers: [0] },
    '00': { type: 'STRAIGHT_UP', numbers: [0] }, // Corrected from [00] to [0] to avoid octal literal
    ...Array.from({ length: 36 }, (_, i) => i + 1).reduce((acc, num) => {
        acc[num.toString()] = { type: 'STRAIGHT_UP', numbers: [num] };
        return acc;
    }, {})
};

/**
 * Bet class to represent individual bets
 */
export class Bet {
    constructor(type, numbers, amount, area = null) {
        this.id = Date.now() + Math.random();
        this.type = type;
        this.numbers = numbers;
        this.amount = amount;
        this.area = area; // For outside bets like 'RED', 'BLACK', etc.
    }
}

/**
 * BettingManager class to handle all betting logic
 */
export class BettingManager {
    constructor() {
        this.currentBets = [];
    }

    placeBet(betType, amount, number = null) {
        if (!BET_TYPES[betType]) {
            console.error(`Invalid bet type: ${betType}`);
            return null;
        }

        if (!BET_AMOUNTS.includes(amount)) {
            console.error(`Invalid bet amount: ${amount}`);
            return null;
        }

        let numbersToBetOn = [];
        let area = null;

        if (BETTING_AREAS[betType]) {
            // Handle outside bets or specific number bets defined in BETTING_AREAS
            numbersToBetOn = BETTING_AREAS[betType].numbers;
            area = betType;
        } else if (betType === 'STRAIGHT_UP' && number !== null) {
            // Handle straight up bets for individual numbers not pre-defined in BETTING_AREAS
            numbersToBetOn = [number];
        } else {
            console.error(`Cannot place bet for type ${betType} with number ${number}`);
            return null;
        }

        const newBet = new Bet(betType, numbersToBetOn, amount, area);
        this.currentBets.push(newBet);
        console.log(`Bet placed: ${betType} on ${numbersToBetOn} for ${amount}`);
        return newBet;
    }

    calculateWinnings(winningNumber) {
        let totalWinnings = 0;
        this.currentBets.forEach(bet => {
            if (bet.numbers.includes(winningNumber)) {
                const payoutRatio = BET_TYPES[bet.type].payout;
                totalWinnings += bet.amount * payoutRatio;
                console.log(`Winning bet: ${bet.type} for ${bet.amount}. Winnings: ${bet.amount * payoutRatio}`);
            }
        });
        this.currentBets = []; // Clear bets after each round
        return totalWinnings;
    }

    clearBets() {
        this.currentBets = [];
        console.log('All bets cleared.');
    }
}

// Exporting the BettingManager class as a default export
export default BettingManager;

// Also exporting a named instance for convenience, if needed elsewhere
export const bettingManager = new BettingManager();