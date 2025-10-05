
export class XpSystem {
  constructor() {
    this.xp = parseInt(localStorage.getItem('playerXp')) || 0;
    this.level = parseInt(localStorage.getItem('playerLevel')) || 1;
  }

  getXp() {
    return this.xp;
  }

  getLevel() {
    return this.level;
  }

  // Formule polynomiale pour l'XP nécessaire pour le niveau n
  // XP_n = 100 * n^1.5
  getXpForNextLevel(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  addXp(amount) {
    this.xp += amount;
    localStorage.setItem('playerXp', this.xp.toString());
    this.checkLevelUp();
  }

  checkLevelUp() {
    let xpNeeded = this.getXpForNextLevel(this.level);
    while (this.xp >= xpNeeded) {
      this.level++;
      this.xp -= xpNeeded; // L'XP excédentaire est reportée au niveau suivant
      localStorage.setItem('playerLevel', this.level.toString());
      localStorage.setItem('playerXp', this.xp.toString()); // Mettre à jour l'XP restante
      xpNeeded = this.getXpForNextLevel(this.level); // Calculer l'XP pour le nouveau niveau
      console.log(`Félicitations ! Vous avez atteint le niveau ${this.level} !`);
      // Ici, on pourrait ajouter une notification ou une récompense
    }
  }

  // Réinitialiser l'XP et le niveau (pour les tests ou une nouvelle partie)
  resetXp() {
    this.xp = 0;
    this.level = 1;
    localStorage.setItem('playerXp', '0');
    localStorage.setItem('playerLevel', '1');
  }
}

