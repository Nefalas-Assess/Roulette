// Génère un résultat aléatoire de roulette américaine
export function spinRoulette() {
  // Nombres de la roulette américaine (0, 00 et 1-36)
  const numbers = [
    { number: "0", color: "green" },
    { number: "00", color: "green" },
    { number: 1, color: "red" },
    { number: 2, color: "black" },
    { number: 3, color: "red" },
    { number: 4, color: "black" },
    { number: 5, color: "red" },
    { number: 6, color: "black" },
    { number: 7, color: "red" },
    { number: 8, color: "black" },
    { number: 9, color: "red" },
    { number: 10, color: "black" },
    { number: 11, color: "black" },
    { number: 12, color: "red" },
    { number: 13, color: "black" },
    { number: 14, color: "red" },
    { number: 15, color: "black" },
    { number: 16, color: "red" },
    { number: 17, color: "black" },
    { number: 18, color: "red" },
    { number: 19, color: "red" },
    { number: 20, color: "black" },
    { number: 21, color: "red" },
    { number: 22, color: "black" },
    { number: 23, color: "red" },
    { number: 24, color: "black" },
    { number: 25, color: "red" },
    { number: 26, color: "black" },
    { number: 27, color: "red" },
    { number: 28, color: "black" },
    { number: 29, color: "black" },
    { number: 30, color: "red" },
    { number: 31, color: "black" },
    { number: 32, color: "red" },
    { number: 33, color: "black" },
    { number: 34, color: "red" },
    { number: 35, color: "black" },
    { number: 36, color: "red" },
  ]

  const randomIndex = Math.floor(Math.random() * numbers.length)
  return numbers[randomIndex]
}

// Calcule les gains selon la mise
export function calculatePayout(bet, amount, outcome) {
  let winnings = 0

  // Mise sur une couleur
  if (bet.toLowerCase() === "red" || bet.toLowerCase() === "black") {
    if (outcome.color === bet.toLowerCase()) {
      winnings = amount * 2
    } else {
      winnings = -amount
    }
  }
  // Mise sur un numéro
  else if (bet === outcome.number.toString()) {
    winnings = amount * 35
  }
  // Perte
  else {
    winnings = -amount
  }

  return winnings
}