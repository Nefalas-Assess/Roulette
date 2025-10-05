
export class WeeklyQuestSystem {
  constructor() {
    this.quests = [];
    this.loadQuests();
  }

  static QUEST_DEFINITIONS = [
    { id: 'volume_bet', type: 'Volume', description: 'Miser un total de 10 000 crédits en 7 jours', target: 10000, rewardXp: 500, rewardCredits: 200, progressKey: 'totalBetAmount' },
    { id: 'total_winnings', type: 'Gains', description: 'Atteindre 5 000 crédits de gains cumulés', target: 5000, rewardXp: 400, rewardCredits: 0, progressKey: 'cumulativeWinnings' },
    { id: 'precision_win_straight_up', type: 'Précision', description: 'Gagner au moins une fois sur un numéro plein', target: 1, rewardXp: 300, rewardCredits: 0, progressKey: 'straightUpWin' },
    { id: 'win_streak_5', type: 'Série', description: 'Atteindre une série de 5 victoires consécutives', target: 5, rewardXp: 500, rewardCredits: 0, progressKey: 'winStreak' },
    { id: 'diversity_bet_types', type: 'Diversité', description: 'Utiliser 5 types de mises différentes', target: 5, rewardXp: 350, rewardCredits: 0, progressKey: 'uniqueBetTypes' },
    { id: 'achievements_unlocked', type: 'Achievements', description: 'Débloquer 3 achievements pendant la semaine', target: 3, rewardXp: 400, rewardCredits: 0, progressKey: 'achievementsUnlocked' },
    { id: 'daily_login_7_days', type: 'Fidélité', description: 'Se connecter chaque jour de la semaine', target: 7, rewardXp: 700, rewardCredits: 0, progressKey: 'consecutiveLogins' },
  ];

  loadQuests() {
    const savedQuests = JSON.parse(localStorage.getItem('weeklyQuests')) || [];
    const lastQuestWeek = localStorage.getItem('lastWeeklyQuestWeek');
    const currentWeek = this.getWeekNumber(new Date());

    if (!lastQuestWeek || parseInt(lastQuestWeek) !== currentWeek || savedQuests.length === 0) {
      this.generateNewQuests();
      localStorage.setItem('lastWeeklyQuestWeek', currentWeek.toString());
    } else {
      this.quests = savedQuests;
    }
  }

  generateNewQuests() {
    // Pour les quêtes hebdomadaires, on peut choisir un ensemble fixe ou aléatoire plus grand
    // Pour l'instant, on va prendre toutes les quêtes définies.
    this.quests = WeeklyQuestSystem.QUEST_DEFINITIONS.map(quest => ({
      ...quest,
      currentProgress: 0,
      completed: false,
      claimed: false,
    }));
    this.saveQuests();
  }

  saveQuests() {
    localStorage.setItem('weeklyQuests', JSON.stringify(this.quests));
  }

  getQuests() {
    return this.quests;
  }

  updateProgress(questId, progressAmount) {
    const quest = this.quests.find(q => q.id === questId);
    if (quest && !quest.completed) {
      quest.currentProgress = Math.min(quest.target, quest.currentProgress + progressAmount);
      if (quest.currentProgress >= quest.target) {
        quest.completed = true;
      }
      this.saveQuests();
      return quest;
    }
    return null;
  }

  claimReward(questId) {
    const quest = this.quests.find(q => q.id === questId);
    if (quest && quest.completed && !quest.claimed) {
      quest.claimed = true;
      this.saveQuests();
      return { xp: quest.rewardXp, credits: quest.rewardCredits };
    }
    return null;
  }

  // Méthodes pour suivre la progression spécifique
  recordBetAmount(amount) {
    this.updateProgress('volume_bet', amount);
  }

  recordCumulativeWinnings(amount) {
    this.updateProgress('total_winnings', amount);
  }

  recordStraightUpWin() {
    this.updateProgress('precision_win_straight_up', 1);
  }

  recordWinStreak(currentStreak) {
    const quest = this.quests.find(q => q.id === 'win_streak_5');
    if (quest && !quest.completed) {
      quest.currentProgress = Math.max(quest.currentProgress, currentStreak);
      if (quest.currentProgress >= quest.target) {
        quest.completed = true;
      }
      this.saveQuests();
      return quest;
    }
    return null;
  }

  recordUniqueBetType(betType) {
    const quest = this.quests.find(q => q.id === 'diversity_bet_types');
    if (quest && !quest.completed) {
      const uniqueBetTypes = new Set(JSON.parse(localStorage.getItem('uniqueBetTypesPlayedThisWeek') || '[]'));
      if (!uniqueBetTypes.has(betType)) {
        uniqueBetTypes.add(betType);
        localStorage.setItem('uniqueBetTypesPlayedThisWeek', JSON.stringify(Array.from(uniqueBetTypes)));
        quest.currentProgress = uniqueBetTypes.size;
        if (quest.currentProgress >= quest.target) {
          quest.completed = true;
        }
        this.saveQuests();
        return quest;
      }
    }
    return null;
  }

  recordAchievementUnlocked() {
    this.updateProgress('achievements_unlocked', 1);
  }

  recordDailyLogin() {
    const quest = this.quests.find(q => q.id === 'daily_login_7_days');
    if (quest && !quest.completed) {
      const lastLoginDate = localStorage.getItem('lastWeeklyLoginDate');
      const today = new Date().toDateString();

      if (lastLoginDate !== today) {
        const consecutiveLogins = parseInt(localStorage.getItem('consecutiveLogins')) || 0;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastLoginDate === yesterday.toDateString()) {
          localStorage.setItem('consecutiveLogins', (consecutiveLogins + 1).toString());
          quest.currentProgress = consecutiveLogins + 1;
        } else {
          localStorage.setItem('consecutiveLogins', '1');
          quest.currentProgress = 1;
        }
        localStorage.setItem('lastWeeklyLoginDate', today);

        if (quest.currentProgress >= quest.target) {
          quest.completed = true;
        }
        this.saveQuests();
        return quest;
      }
    }
    return null;
  }

  // Helper pour obtenir le numéro de la semaine
  getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  }
}

