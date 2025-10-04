// walletSystem.js
class WalletSystem {
  constructor(initialBalance = 10000) {
    this.balance = initialBalance;
    this.loadBalance();
  }

  loadBalance() {
    const saved = localStorage.getItem('walletBalance');
    if (saved) {
      this.balance = parseInt(saved);
    }
  }

  saveBalance() {
    localStorage.setItem('walletBalance', this.balance.toString());
  }

  getBalance() {
    return this.balance;
  }

  addBalance(amount) {
    this.balance += amount;
    this.saveBalance();
    return this.balance;
  }

  deductBalance(amount) {
    if (this.balance >= amount) {
      this.balance -= amount;
      this.saveBalance();
      return true;
    }
    return false;
  }

  validateTransaction(amount) {
    if (amount <= 0) {
      return { valid: false, reason: 'Le montant doit être positif' };
    }
    if (this.balance < amount) {
      return { valid: false, reason: 'Solde insuffisant' };
    }
    return { valid: true };
  }

claimHourlyReward() {
    const reward = 1000;
    this.addBalance(reward);
    return reward;
  }

  claimAdReward() {
    const reward = 500;
    this.addBalance(reward);
    return reward;
  }
}

// IMPORTANT : Export nommé
export { WalletSystem };