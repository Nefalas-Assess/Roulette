// rouletteLogic.js - Logique de la roulette américaine

// Numéros rouges sur la roulette
const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 
  19, 21, 23, 25, 27, 30, 32, 34, 36
];

// Tous les numéros de la roulette américaine (avec 0 et 00)
const AMERICAN_WHEEL = [
  0, '00', 
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 34, 35, 36
];

/**
 * Simule un tour de roulette
 * @returns {Object} Résultat avec number et color
 */
export function spinWheel() {
  const randomIndex = Math.floor(Math.random() * AMERICAN_WHEEL.length);
  const number = AMERICAN_WHEEL[randomIndex];
  
  let color = 'green';
  if (number !== 0 && number !== '00') {
    color = RED_NUMBERS.includes(number) ? 'red' : 'black';
  }
  
  return { number, color };
}

/**
 * Calcule le paiement pour un pari simple (legacy)
 * Note: Cette fonction est maintenant redondante avec BettingManager
 * mais conservée pour compatibilité ascendante
 * @param {string|number} bet - Le pari placé
 * @param {Object} result - Le résultat du spin
 * @returns {number} Multiplicateur de paiement
 */
export function calculatePayout(bet, result) {
  // Pari sur couleur (rouge ou noir)
  if (bet === result.color) {
    return 2; // Payout 1:1 + mise initiale
  }
  
  // Pari sur numéro unique (straight up)
  if (bet === result.number) {
    return 36; // Payout 35:1 + mise initiale
  }
  
  return 0; // Pari perdu
}

/**
 * Obtient la couleur d'un numéro
 * @param {number|string} number - Le numéro à vérifier
 * @returns {string} 'red', 'black', ou 'green'
 */
export function getNumberColor(number) {
  if (number === 0 || number === '00') {
    return 'green';
  }
  return RED_NUMBERS.includes(number) ? 'red' : 'black';
}

/**
 * Vérifie si un numéro est pair
 * @param {number} number - Le numéro à vérifier
 * @returns {boolean}
 */
export function isEven(number) {
  return number !== 0 && number !== '00' && number % 2 === 0;
}

/**
 * Vérifie si un numéro est impair
 * @param {number} number - Le numéro à vérifier
 * @returns {boolean}
 */
export function isOdd(number) {
  return number !== 0 && number !== '00' && number % 2 === 1;
}

// Export des constantes
export { RED_NUMBERS, AMERICAN_WHEEL };
