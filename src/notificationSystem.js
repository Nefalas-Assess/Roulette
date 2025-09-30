export class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.listeners = [];
    this.notificationId = 0;
  }

  onNotification(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  showNotification(type, title, message, duration = 5000) {
    const notification = {
      id: ++this.notificationId,
      type,
      title,
      message,
      timestamp: Date.now(),
      duration
    };

    this.notifications.push(notification);
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });

    // Auto-remove after duration
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, duration);

    return notification;
  }

  removeNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  showWin(amount) {
    return this.showNotification(
      'win',
      '🎉 Victoire !',
      `Vous avez gagné ${amount} tokens !`,
      4000
    );
  }

  showLoss(amount) {
    return this.showNotification(
      'loss',
      '😔 Perdu',
      `Vous avez perdu ${amount} tokens`,
      3000
    );
  }

  showBigWin(amount) {
    return this.showNotification(
      'big_win',
      '🎊 GROS GAIN !',
      `Incroyable ! Vous avez gagné ${amount} tokens !`,
      6000
    );
  }

  showJackpot(amount) {
    return this.showNotification(
      'jackpot',
      '💎 JACKPOT !',
      `FANTASTIQUE ! Gain de ${amount} tokens !`,
      8000
    );
  }

  showAchievement(achievement) {
    return this.showNotification(
      'achievement',
      `🏆 ${achievement.name}`,
      achievement.description,
      6000
    );
  }

  showTokensClaimed(amount) {
    return this.showNotification(
      'tokens_claimed',
      '⏰ Tokens réclamés',
      `+${amount} tokens ajoutés à votre solde`,
      3000
    );
  }

  showAdReward(amount) {
    return this.showNotification(
      'ad_reward',
      '📺 Publicité terminée',
      `+${amount} tokens ajoutés à votre solde`,
      4000
    );
  }

  showLevelUp(level) {
    return this.showNotification(
      'level_up',
      '⭐ Niveau supérieur !',
      `Félicitations ! Vous êtes maintenant niveau ${level}`,
      5000
    );
  }

  showStreak(count, type = 'win') {
    const emoji = type === 'win' ? '🔥' : '❄️';
    const text = type === 'win' ? 'victoires' : 'défaites';
    
    return this.showNotification(
      'streak',
      `${emoji} Série de ${count}`,
      `${count} ${text} consécutives !`,
      4000
    );
  }

  showSpecialEvent(title, message) {
    return this.showNotification(
      'special',
      `✨ ${title}`,
      message,
      5000
    );
  }

  showWarning(title, message) {
    return this.showNotification(
      'warning',
      `⚠️ ${title}`,
      message,
      4000
    );
  }

  showInfo(title, message) {
    return this.showNotification(
      'info',
      `ℹ️ ${title}`,
      message,
      3000
    );
  }

  showError(title, message) {
    return this.showNotification(
      'error',
      `❌ ${title}`,
      message,
      4000
    );
  }

  // Game-specific notifications
  showStraightUpWin(number, amount) {
    return this.showNotification(
      'straight_win',
      `🎯 Numéro ${number} !`,
      `Mise directe gagnante ! +${amount} tokens`,
      5000
    );
  }

  showColorWin(color, amount) {
    const emoji = color === 'red' ? '🔴' : '⚫';
    return this.showNotification(
      'color_win',
      `${emoji} ${color.toUpperCase()} gagnant !`,
      `+${amount} tokens`,
      3000
    );
  }

  showDozenWin(dozen, amount) {
    return this.showNotification(
      'dozen_win',
      `📊 Douzaine ${dozen} !`,
      `+${amount} tokens`,
      3000
    );
  }

  showEvenMoneyWin(betType, amount) {
    const labels = {
      'even': 'PAIR',
      'odd': 'IMPAIR',
      '1-18': '1-18',
      '19-36': '19-36'
    };
    
    return this.showNotification(
      'even_money_win',
      `✅ ${labels[betType]} gagnant !`,
      `+${amount} tokens`,
      3000
    );
  }

  showMultipleBetsWin(winningBets, totalAmount) {
    return this.showNotification(
      'multiple_win',
      `🎊 Mises multiples !`,
      `${winningBets} paris gagnants ! +${totalAmount} tokens`,
      4000
    );
  }

  showLowTokensWarning(currentTokens) {
    if (currentTokens <= 100) {
      return this.showNotification(
        'warning',
        '⚠️ Tokens faibles',
        'Il vous reste peu de tokens. Regardez une publicité ou réclamez vos tokens horaires !',
        5000
      );
    }
  }

  showFirstGameWelcome() {
    return this.showNotification(
      'welcome',
      '🎰 Bienvenue !',
      'Placez votre premier pari et faites tourner la roulette !',
      6000
    );
  }

  showTutorialTip(tip) {
    return this.showNotification(
      'tip',
      '💡 Astuce',
      tip,
      5000
    );
  }

  // Batch notifications for multiple events
  showBatchNotifications(notifications) {
    notifications.forEach((notif, index) => {
      setTimeout(() => {
        this.showNotification(notif.type, notif.title, notif.message, notif.duration);
      }, index * 500); // Stagger notifications by 500ms
    });
  }

  // Get current notifications
  getActiveNotifications() {
    return this.notifications.filter(n => 
      Date.now() - n.timestamp < n.duration
    );
  }

  // Clear all notifications
  clearAllNotifications() {
    this.notifications = [];
  }

  // Get notification history
  getNotificationHistory(limit = 50) {
    return this.notifications
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Statistics
  getNotificationStats() {
    const stats = {
      total: this.notifications.length,
      byType: {},
      recent: this.notifications.filter(n => 
        Date.now() - n.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
      ).length
    };

    this.notifications.forEach(notif => {
      stats.byType[notif.type] = (stats.byType[notif.type] || 0) + 1;
    });

    return stats;
  }
}

