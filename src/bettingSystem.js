// bettingSystem.js - Advanced betting system for roulette game

/**
 * Available bet amounts
 */
export const BET_AMOUNTS = [10, 25, 50, 100, 250, 500];

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
    HIGH: { name: '19-36', payout: 1, description: 'Numbers 19-36' },
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
    constructor(type, value, amount, numbers) {
        this.id = Date.now() + Math.random();
        this.type = type;
        this.value = value; // The specific value bet on (e.g., 'RED', 15, 'FIRST_DOZEN')
        this.amount = amount;
        this.numbers = numbers; // Array of numbers covered by this bet
    }
}

/**
 * BettingManager class to handle all betting logic
 */
export class BettingManager {
    constructor() {
        this.currentBets = [];
    }

    addBet(type, value, amount) {
        if (!BET_TYPES[type]) {
            throw new Error(`Type de pari invalide: ${type}`);
        }
        if (!BET_AMOUNTS.includes(amount) && amount !== 'all-in') {
            throw new Error(`Montant de pari invalide: ${amount}`);
        }

        let numbersCovered = [];
        if (type === 'STRAIGHT_UP') {
            numbersCovered = [value];
        } else if (BETTING_AREAS[value]) {
            numbersCovered = BETTING_AREAS[value].numbers;
        } else {
            throw new Error(`Impossible de déterminer les numéros couverts pour le pari: ${type} sur ${value}`);
        }

        // Vérifier s'il existe déjà un pari du même type et valeur
        const existingBetIndex = this.currentBets.findIndex(bet => 
            bet.type === type && bet.value === value
        );

        if (existingBetIndex > -1) {
            // Augmenter le montant du pari existant
            this.currentBets[existingBetIndex].amount += amount;
            console.log(`[LOG - BettingManager] Pari augmenté: Type=${type}, Valeur=${value}, Nouveau montant=${this.currentBets[existingBetIndex].amount}`);
            return this.currentBets[existingBetIndex];
        } else {
            // Créer un nouveau pari
            const newBet = new Bet(type, value, amount, numbersCovered);
            this.currentBets.push(newBet);
            console.log(`[LOG - BettingManager] Pari ajouté: Type=${type}, Valeur=${value}, Montant=${amount}`);
            return newBet;
        }
    }

    removeBet(id) {
        const index = this.currentBets.findIndex(bet => bet.id === id);
        if (index > -1) {
            const removedBet = this.currentBets.splice(index, 1)[0];
            console.log(`[LOG - BettingManager] Pari retiré: Type=${removedBet.type}, Valeur=${removedBet.value}, Montant=${removedBet.amount}`);
            return removedBet;
        }
        return null;
    }

    // Nouvelle méthode pour retirer un montant spécifique d'un pari
    reduceBet(type, value, amount) {
        const existingBetIndex = this.currentBets.findIndex(bet => 
            bet.type === type && bet.value === value
        );

        if (existingBetIndex > -1) {
            const bet = this.currentBets[existingBetIndex];
            if (bet.amount > amount) {
                // Réduire le montant du pari
                bet.amount -= amount;
                console.log(`[LOG - BettingManager] Pari réduit: Type=${type}, Valeur=${value}, Nouveau montant=${bet.amount}`);
                return bet;
            } else {
                // Supprimer le pari si le montant à retirer est >= au montant actuel
                return this.removeBet(bet.id);
            }
        }
        return null;
    }

    getBets() {
        return [...this.currentBets];
    }

    getBetAmount(type, value) {
        const bet = this.currentBets.find(bet => bet.type === type && bet.value === value);
        return bet ? bet.amount : 0;
    }

    getLastBetType() {
        if (this.currentBets.length > 0) {
            return this.currentBets[this.currentBets.length - 1].type;
        }
        return null;
    }

    getLastBetValue() {
        if (this.currentBets.length > 0) {
            return this.currentBets[this.currentBets.length - 1].value;
        }
        return null;
    }

    getTotalBetAmount() {
        return this.currentBets.reduce((total, bet) => total + bet.amount, 0);
    }

    calculateTotalWinnings(winningNumber) {
        let totalWinnings = 0;
        this.currentBets.forEach(bet => {
            if (bet.numbers.includes(winningNumber)) {
                // Pour ALL_IN, le payout est basé sur le type de pari sous-jacent (ici, RED)
                const payoutRatio = BET_TYPES[bet.type].payout;
                totalWinnings += bet.amount * (payoutRatio + 1); // +1 pour récupérer la mise initiale
                console.log(`[LOG - BettingManager] Pari gagnant: Type=${bet.type}, Valeur=${bet.value}, Montant=${bet.amount}, Payout=${payoutRatio + 1}, Gains=${bet.amount * (payoutRatio + 1)}`);
            }
        });
        return totalWinnings;
    }

    clearBets() {
        this.currentBets = [];
        console.log("[LOG - BettingManager] Tous les paris effacés.");
    }
}

// Exporting the BettingManager class as a default export
export default BettingManager;

// Also exporting a named instance for convenience, if needed elsewhere
export const bettingManager = new BettingManager();