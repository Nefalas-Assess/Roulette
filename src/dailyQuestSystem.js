
export class DailyQuestSystem {
  constructor() {
    this.quests = [];
    this.loadQuests();
  }

  static QUEST_DEFINITIONS = [
    { id: 'play_10_rounds', type: 'Jeu', description: 'Jouer 10 tours de roulette', target: 10, rewardXp: 50, rewardTokens: 0, rewardTicket: false, progressKey: 'roundsPlayed' },
    { id: 'win_3_red_black', type: 'Mise simple', description: 'Gagner 3 fois d\'affilée sur Rouge ou Noir', target: 3, rewardXp: 75, rewardTokens: 0, rewardTicket: false, progressKey: 'redBlackWinStreak' },
    { id: 'bet_5_straight_up', type: 'Mise risquée', description: 'Tenter 5 mises sur un numéro plein', target: 5, rewardXp: 100, rewardTokens: 0, rewardTicket: false, progressKey: 'straightUpBets' },
    { id: 'total_win_500', type: 'Gain', description: 'Atteindre un gain total de 500 crédits', target: 500, rewardXp: 75, rewardTokens: 0, rewardTicket: false, progressKey: 'totalWinnings' },
    { id: 'bet_all_dozens', type: 'Variété', description: 'Miser sur toutes les douzaines au moins une fois', target: 1, rewardXp: 60, rewardTokens: 0, rewardTicket: false, progressKey: 'dozensBet' },
    { id: 'play_3_sessions', type: 'Fidélité', description: 'Jouer 3 sessions dans la journée (matin/midi/soir)', target: 3, rewardXp: 80, rewardTokens: 0, rewardTicket: false, progressKey: 'sessionsPlayed' },
  ];

  loadQuests() {
    const savedQuests = JSON.parse(localStorage.getItem('dailyQuests')) || [];
    const lastQuestDate = localStorage.getItem('lastDailyQuestDate');
    const today = new Date().toDateString();

    if (!lastQuestDate || lastQuestDate !== today || savedQuests.length === 0) {
      this.generateNewQuests();
      localStorage.setItem('lastDailyQuestDate', today);
    } else {
      this.quests = savedQuests;
    }
  }

  generateNewQuests() {
    // Sélectionner 3 quêtes aléatoires pour la journée
    const shuffled = [...DailyQuestSystem.QUEST_DEFINITIONS].sort(() => 0.5 - Math.random());
    this.quests = shuffled.slice(0, 3).map(quest => ({
      ...quest,
      currentProgress: 0,
      completed: false,
      claimed: false,
    }));
    this.saveQuests();
  }

  saveQuests() {
    localStorage.setItem('dailyQuests', JSON.stringify(this.quests));
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
      return { xp: quest.rewardXp, tokens: quest.rewardTokens, ticket: quest.rewardTicket };
    }
    return null;
  }

  // Méthodes pour suivre la progression spécifique
  recordRoundPlayed() {
    this.updateProgress('play_10_rounds', 1);
  }

  recordStraightUpBet() {
    this.updateProgress('bet_5_straight_up', 1);
  }

  recordWinnings(amount) {
    this.updateProgress('total_win_500', amount);
  }

  recordDozensBet(betType) {
    // Cette quête est un peu plus complexe, il faut s'assurer que toutes les douzaines ont été misées
    // Pour simplifier, on peut juste incrémenter si une douzaine est misée, et la validation finale
    // se fera au moment de la complétion si on veut être plus précis.
    // Pour l'instant, on va juste incrémenter si c'est une douzaine.
    if (betType === 'DOZEN') {
      this.updateProgress('bet_all_dozens', 1);
    }
  }

  recordLogin() {
    const lastLoginDate = localStorage.getItem('lastLoginDate');
    const today = new Date().toDateString();

    if (lastLoginDate !== today) {
      localStorage.setItem('lastLoginDate', today);
      // Logique pour le bonus journalier de connexion (10 XP)
      // Cette XP sera ajoutée directement dans App.jsx lors de l'initialisation
    }
  }

  // Pour la quête de série de victoires sur Rouge/Noir
  recordRedBlackWin(isWin) {
    const quest = this.quests.find(q => q.id === 'win_3_red_black');
    if (quest && !quest.completed) {
      if (isWin) {
        quest.currentProgress++;
      } else {
        quest.currentProgress = 0; // Réinitialiser la série en cas de perte
      }
      if (quest.currentProgress >= quest.target) {
        quest.completed = true;
      }
      this.saveQuests();
      return quest;
    }
    return null;
  }

  // Pour la quête de sessions jouées
  recordSession() {
    const quest = this.quests.find(q => q.id === 'play_3_sessions');
    if (quest && !quest.completed) {
      const lastSessionTime = parseInt(localStorage.getItem('lastSessionTime')) || 0;
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 heure

      // Si la dernière session était il y a plus d'une heure, on compte une nouvelle session
      if (now - lastSessionTime > oneHour) {
        quest.currentProgress++;
        localStorage.setItem('lastSessionTime', now.toString());
      }
      if (quest.currentProgress >= quest.target) {
        quest.completed = true;
      }
      this.saveQuests();
      return quest;
    }
    return null;
  }
}

