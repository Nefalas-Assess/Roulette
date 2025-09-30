export class AchievementSystem {
  constructor() {
    this.achievements = this.initializeAchievements();
    this.unlockedAchievements = this.loadUnlockedAchievements();
    this.gameStats = this.loadGameStats();
  }

  initializeAchievements() {
    return [
      // 🏆 Progression & Découverte
      {
        id: 'first_bet',
        name: 'Premier pari',
        description: 'Faire son tout premier pari',
        icon: '🎯',
        category: 'progression',
        condition: (gameResult, stats) => stats.totalGames >= 1
      },
      {
        id: 'first_win',
        name: 'Première victoire',
        description: 'Gagner une mise',
        icon: '🎉',
        category: 'progression',
        condition: (gameResult, stats) => gameResult.profit > 0 && !this.isUnlocked('first_win')
      },
      {
        id: 'wheel_spinner_50',
        name: 'La roue tourne',
        description: 'Jouer 50 parties',
        icon: '🎰',
        category: 'progression',
        condition: (gameResult, stats) => stats.totalGames >= 50
      },
      {
        id: 'green_carpet_addict',
        name: 'Accro au tapis vert',
        description: 'Jouer 500 parties',
        icon: '🟢',
        category: 'progression',
        condition: (gameResult, stats) => stats.totalGames >= 500
      },
      {
        id: 'casino_marathoner',
        name: 'Marathonien du casino',
        description: 'Jouer 1 000 parties',
        icon: '🏃‍♂️',
        category: 'progression',
        condition: (gameResult, stats) => stats.totalGames >= 1000
      },

      // 🎯 Types de mises
      {
        id: 'the_brave',
        name: 'Le courageux',
        description: 'Miser tout sur un seul numéro',
        icon: '🦁',
        category: 'betting',
        condition: (gameResult, stats) => {
          const straightBets = Object.keys(gameResult.bets).filter(key => key.startsWith('straight-'));
          return straightBets.length === 1 && gameResult.totalBet === Object.values(gameResult.bets)[0];
        }
      },
      {
        id: 'the_strategist',
        name: 'Le stratège',
        description: 'Placer un pari qui couvre au moins 12 numéros',
        icon: '🧠',
        category: 'betting',
        condition: (gameResult, stats) => {
          return Object.keys(gameResult.bets).some(key => 
            key.startsWith('dozen-') || key.startsWith('column-')
          );
        }
      },
      {
        id: 'red_or_black_winner',
        name: 'Rouge ou noir',
        description: 'Gagner en misant sur une couleur',
        icon: '🔴',
        category: 'betting',
        condition: (gameResult, stats) => {
          return gameResult.profit > 0 && (
            gameResult.bets['even_money-red'] || gameResult.bets['even_money-black']
          );
        }
      },
      {
        id: 'even_odd_winner',
        name: 'Pair ou impair',
        description: 'Gagner en misant sur la parité',
        icon: '⚖️',
        category: 'betting',
        condition: (gameResult, stats) => {
          return gameResult.profit > 0 && (
            gameResult.bets['even_money-even'] || gameResult.bets['even_money-odd']
          );
        }
      },
      {
        id: 'low_numbers_winner',
        name: '1 à 18',
        description: 'Gagner en misant sur la première moitié des numéros',
        icon: '📉',
        category: 'betting',
        condition: (gameResult, stats) => {
          return gameResult.profit > 0 && gameResult.bets['even_money-1-18'];
        }
      },
      {
        id: 'high_numbers_winner',
        name: '19 à 36',
        description: 'Gagner en misant sur la seconde moitié des numéros',
        icon: '📈',
        category: 'betting',
        condition: (gameResult, stats) => {
          return gameResult.profit > 0 && gameResult.bets['even_money-19-36'];
        }
      },
      {
        id: 'martingale_master',
        name: "L'art de la martingale",
        description: 'Gagner après avoir doublé sa mise suite à une perte',
        icon: '📊',
        category: 'betting',
        condition: (gameResult, stats) => {
          // This would need more complex tracking of bet progression
          return false; // Placeholder for now
        }
      },

      // 💎 Rare & chance
      {
        id: 'precision_jackpot',
        name: 'Jackpot de précision',
        description: 'Taper juste sur un numéro plein (straight up)',
        icon: '🎯',
        category: 'rare',
        condition: (gameResult, stats) => {
          const straightBet = Object.keys(gameResult.bets).find(key => 
            key.startsWith('straight-') && key.endsWith(`-${gameResult.number}`)
          );
          return straightBet && gameResult.profit > 0;
        }
      },
      {
        id: 'double_zero_magic',
        name: 'Double zéro magique',
        description: 'Gagner en misant sur le 00',
        icon: '🎭',
        category: 'rare',
        condition: (gameResult, stats) => {
          return gameResult.number === '00' && gameResult.bets['straight-00'] && gameResult.profit > 0;
        }
      },
      {
        id: 'house_loses',
        name: 'La maison perd',
        description: 'Gagner 5 fois de suite contre la banque',
        icon: '🏠',
        category: 'rare',
        condition: (gameResult, stats) => {
          return this.gameStats.currentWinStreak >= 5;
        }
      },
      {
        id: 'lucky_streak',
        name: 'Série chanceuse',
        description: 'Enchaîner 3 victoires consécutives',
        icon: '🍀',
        category: 'rare',
        condition: (gameResult, stats) => {
          return this.gameStats.currentWinStreak >= 3;
        }
      },
      {
        id: 'insolent_luck',
        name: 'Chance insolente',
        description: 'Gagner 10 paris consécutifs',
        icon: '✨',
        category: 'rare',
        condition: (gameResult, stats) => {
          return this.gameStats.currentWinStreak >= 10;
        }
      },

      // 💰 Gestion & gains
      {
        id: 'small_player',
        name: 'Petit joueur',
        description: 'Doubler sa mise initiale',
        icon: '💰',
        category: 'money',
        condition: (gameResult, stats) => {
          return stats.totalProfit >= 1000; // Starting tokens
        }
      },
      {
        id: 'big_winner',
        name: 'Grand gagnant',
        description: 'Atteindre un bénéfice de 1 000 crédits',
        icon: '💎',
        category: 'money',
        condition: (gameResult, stats) => {
          return stats.totalProfit >= 1000;
        }
      },
      {
        id: 'millionaire',
        name: 'Millionnaire',
        description: 'Cumuler 1 000 000 de crédits',
        icon: '👑',
        category: 'money',
        condition: (gameResult, stats) => {
          return this.gameStats.currentTokens >= 1000000;
        }
      },
      {
        id: 'all_in',
        name: 'All-in',
        description: 'Miser tout son solde d\'un coup',
        icon: '🎲',
        category: 'money',
        condition: (gameResult, stats) => {
          return gameResult.totalBet >= this.gameStats.tokensBeforeBet;
        }
      },
      {
        id: 'phoenix_return',
        name: 'Retour du phénix',
        description: 'Revenir à un solde positif après être tombé à 0',
        icon: '🔥',
        category: 'money',
        condition: (gameResult, stats) => {
          return this.gameStats.hasBeenAtZero && this.gameStats.currentTokens > 0;
        }
      },

      // 🔥 Achievements spéciaux
      {
        id: 'blood_red',
        name: 'Rouge sang',
        description: 'Gagner 10 mises consécutives sur le rouge',
        icon: '🩸',
        category: 'special',
        condition: (gameResult, stats) => {
          return this.gameStats.consecutiveRedWins >= 10;
        }
      },
      {
        id: 'total_black',
        name: 'Noir total',
        description: 'Gagner 10 mises consécutives sur le noir',
        icon: '⚫',
        category: 'special',
        condition: (gameResult, stats) => {
          return this.gameStats.consecutiveBlackWins >= 10;
        }
      },
      {
        id: 'collector',
        name: 'Collectionneur',
        description: 'Avoir gagné au moins une fois sur chaque type de mise',
        icon: '📚',
        category: 'special',
        condition: (gameResult, stats) => {
          const requiredBetTypes = ['straight', 'dozen', 'even_money'];
          return requiredBetTypes.every(type => 
            this.gameStats.wonBetTypes.includes(type)
          );
        }
      },
      {
        id: 'carpet_sniper',
        name: 'Sniper du tapis',
        description: 'Avoir gagné au moins une fois sur chaque numéro (0, 00, 1–36)',
        icon: '🎯',
        category: 'special',
        condition: (gameResult, stats) => {
          const allNumbers = [0, '00', ...Array.from({length: 36}, (_, i) => i + 1)];
          return allNumbers.every(num => 
            this.gameStats.wonNumbers.includes(num)
          );
        }
      },
      {
        id: 'immortal',
        name: 'Immortel',
        description: 'Jouer 100 parties sans jamais tomber à zéro',
        icon: '⚡',
        category: 'special',
        condition: (gameResult, stats) => {
          return stats.totalGames >= 100 && !this.gameStats.hasBeenAtZero;
        }
      }
    ];
  }

  checkAchievements(gameResult, stats) {
    this.updateGameStats(gameResult, stats);
    
    const newAchievements = [];
    
    for (const achievement of this.achievements) {
      if (!this.isUnlocked(achievement.id) && achievement.condition(gameResult, stats)) {
        newAchievements.push(achievement);
        this.unlockAchievement(achievement);
      }
    }
    
    this.saveGameStats();
    this.saveUnlockedAchievements();
    
    return newAchievements;
  }

  updateGameStats(gameResult, stats) {
    // Update win/loss streaks
    if (gameResult.profit > 0) {
      this.gameStats.currentWinStreak = (this.gameStats.currentWinStreak || 0) + 1;
      this.gameStats.currentLossStreak = 0;
      
      // Track color wins
      if (gameResult.bets['even_money-red']) {
        this.gameStats.consecutiveRedWins = (this.gameStats.consecutiveRedWins || 0) + 1;
        this.gameStats.consecutiveBlackWins = 0;
      } else if (gameResult.bets['even_money-black']) {
        this.gameStats.consecutiveBlackWins = (this.gameStats.consecutiveBlackWins || 0) + 1;
        this.gameStats.consecutiveRedWins = 0;
      } else {
        this.gameStats.consecutiveRedWins = 0;
        this.gameStats.consecutiveBlackWins = 0;
      }
      
      // Track won bet types
      Object.keys(gameResult.bets).forEach(betKey => {
        const betType = betKey.split('-')[0];
        if (!this.gameStats.wonBetTypes.includes(betType)) {
          this.gameStats.wonBetTypes.push(betType);
        }
      });
      
      // Track won numbers
      if (!this.gameStats.wonNumbers.includes(gameResult.number)) {
        this.gameStats.wonNumbers.push(gameResult.number);
      }
    } else {
      this.gameStats.currentLossStreak = (this.gameStats.currentLossStreak || 0) + 1;
      this.gameStats.currentWinStreak = 0;
      this.gameStats.consecutiveRedWins = 0;
      this.gameStats.consecutiveBlackWins = 0;
    }
    
    // Update token tracking
    this.gameStats.tokensBeforeBet = this.gameStats.currentTokens || 1000;
    this.gameStats.currentTokens = this.gameStats.tokensBeforeBet + gameResult.profit;
    
    if (this.gameStats.currentTokens <= 0) {
      this.gameStats.hasBeenAtZero = true;
    }
  }

  isUnlocked(achievementId) {
    return this.unlockedAchievements.some(a => a.id === achievementId);
  }

  unlockAchievement(achievement) {
    if (!this.isUnlocked(achievement.id)) {
      this.unlockedAchievements.push({
        ...achievement,
        unlockedAt: Date.now()
      });
    }
  }

  getAllAchievements() {
    return this.achievements;
  }

  getUnlockedAchievements() {
    return this.unlockedAchievements;
  }

  getAchievementsByCategory(category) {
    return this.achievements.filter(a => a.category === category);
  }

  getUnlockedCount() {
    return this.unlockedAchievements.length;
  }

  getTotalCount() {
    return this.achievements.length;
  }

  getCompletionPercentage() {
    return (this.getUnlockedCount() / this.getTotalCount()) * 100;
  }

  loadUnlockedAchievements() {
    try {
      const saved = localStorage.getItem('roulette_achievements');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading achievements:', error);
      return [];
    }
  }

  saveUnlockedAchievements() {
    try {
      localStorage.setItem('roulette_achievements', JSON.stringify(this.unlockedAchievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  }

  loadGameStats() {
    try {
      const saved = localStorage.getItem('roulette_game_stats');
      return saved ? JSON.parse(saved) : {
        currentWinStreak: 0,
        currentLossStreak: 0,
        consecutiveRedWins: 0,
        consecutiveBlackWins: 0,
        wonBetTypes: [],
        wonNumbers: [],
        currentTokens: 1000,
        tokensBeforeBet: 1000,
        hasBeenAtZero: false
      };
    } catch (error) {
      console.error('Error loading game stats:', error);
      return {
        currentWinStreak: 0,
        currentLossStreak: 0,
        consecutiveRedWins: 0,
        consecutiveBlackWins: 0,
        wonBetTypes: [],
        wonNumbers: [],
        currentTokens: 1000,
        tokensBeforeBet: 1000,
        hasBeenAtZero: false
      };
    }
  }

  saveGameStats() {
    try {
      localStorage.setItem('roulette_game_stats', JSON.stringify(this.gameStats));
    } catch (error) {
      console.error('Error saving game stats:', error);
    }
  }

  resetAchievements() {
    this.unlockedAchievements = [];
    this.gameStats = {
      currentWinStreak: 0,
      currentLossStreak: 0,
      consecutiveRedWins: 0,
      consecutiveBlackWins: 0,
      wonBetTypes: [],
      wonNumbers: [],
      currentTokens: 1000,
      tokensBeforeBet: 1000,
      hasBeenAtZero: false
    };
    this.saveUnlockedAchievements();
    this.saveGameStats();
  }
}

export { AchievementSystem };