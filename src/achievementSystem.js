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
                icon: '🏆',
                category: 'progression',
                condition: (gameResult, stats) => gameResult.profit > 0 && !this.isUnlocked('first_win')
            },
            {
                id: 'wheel_spinner_50',
                name: 'La roue tourne',
                description: 'Jouer 50 parties',
                icon: '🎡',
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
                icon: '🏅',
                category: 'progression',
                condition: (gameResult, stats) => stats.totalGames >= 1000
            },

            // 💰 Types de mises
            {
                id: 'the_brave',
                name: 'Le courageux',
                description: 'Miser tout sur un seul numéro',
                icon: '💪',
                category: 'betting',
                condition: (gameResult, stats) => stats.betTypes.straightUp >= 1
            },
            {
                id: 'the_strategist',
                name: 'Le stratège',
                description: 'Miser sur une douzaine ou une colonne',
                icon: '🧠',
                category: 'betting',
                condition: (gameResult, stats) => stats.betTypes.dozenOrColumn >= 1
            },
            {
                id: 'the_balanced',
                name: 'L\'équilibré',
                description: 'Miser sur rouge/noir ou pair/impair',
                icon: '⚖️',
                category: 'betting',
                condition: (gameResult, stats) => stats.betTypes.redBlackEvenOdd >= 1
            },

            // 🍀 Gains
            {
                id: 'lucky_streak_3',
                name: 'Série chanceuse (3)',
                description: 'Gagner 3 fois de suite',
                icon: '✨',
                category: 'winnings',
                condition: (gameResult, stats) => stats.consecutiveWins >= 3
            },
            {
                id: 'lucky_streak_5',
                name: 'Série chanceuse (5)',
                description: 'Gagner 5 fois de suite',
                icon: '🌟',
                category: 'winnings',
                condition: (gameResult, stats) => stats.consecutiveWins >= 5
            },
            {
                id: 'big_spender',
                name: 'Gros parieur',
                description: 'Miser plus de 1000 crédits en une seule partie',
                icon: '💸',
                category: 'winnings',
                condition: (gameResult, stats) => gameResult.totalBetAmount >= 1000
            },

            // 🔄 Spécifiques à la Roulette
            {
                id: 'zero_hero',
                name: 'Héros du zéro',
                description: 'Gagner en misant sur le 0 ou 00',
                icon: '💚',
                category: 'roulette_specific',
                condition: (gameResult, stats) => gameResult.winningNumber === 0 || gameResult.winningNumber === '00'
            },
            {
                id: 'perfect_spin',
                name: 'Tour parfait',
                description: 'La bille tombe sur votre numéro Straight Up',
                icon: '🎯',
                category: 'roulette_specific',
                condition: (gameResult, stats) => gameResult.betType === 'STRAIGHT_UP' && gameResult.winningNumber === gameResult.betNumber
            }
        ];
    }

    loadUnlockedAchievements() {
        const savedAchievements = localStorage.getItem('unlockedAchievements');
        return savedAchievements ? new Set(JSON.parse(savedAchievements)) : new Set();
    }

    saveUnlockedAchievements() {
        localStorage.setItem('unlockedAchievements', JSON.stringify(Array.from(this.unlockedAchievements)));
    }

    loadGameStats() {
        const savedStats = localStorage.getItem('gameStats');
        return savedStats ? JSON.parse(savedStats) : {
            totalGames: 0,
            totalWins: 0,
            totalLosses: 0,
            consecutiveWins: 0,
            betTypes: {
                straightUp: 0,
                dozenOrColumn: 0,
                redBlackEvenOdd: 0
            }
        };
    }

    saveGameStats() {
        localStorage.setItem('gameStats', JSON.stringify(this.gameStats));
    }

    updateGameStats(gameResult) {
        this.gameStats.totalGames++;
        if (gameResult.profit > 0) {
            this.gameStats.totalWins++;
            this.gameStats.consecutiveWins++;
        } else {
            this.gameStats.totalLosses++;
            this.gameStats.consecutiveWins = 0;
        }

        // Update bet type stats (simplified example)
        if (gameResult.betType === 'STRAIGHT_UP') {
            this.gameStats.betTypes.straightUp++;
        } else if (['DOZEN', 'COLUMN'].includes(gameResult.betType)) {
            this.gameStats.betTypes.dozenOrColumn++;
        } else if (['RED', 'BLACK', 'EVEN', 'ODD'].includes(gameResult.betType)) {
            this.gameStats.betTypes.redBlackEvenOdd++;
        }

        this.saveGameStats();
    }

    checkAchievements(gameResult) {
        this.achievements.forEach(achievement => {
            if (!this.isUnlocked(achievement.id) && achievement.condition(gameResult, this.gameStats)) {
                this.unlockAchievement(achievement.id);
            }
        });
    }

    isUnlocked(achievementId) {
        return this.unlockedAchievements.has(achievementId);
    }

    unlockAchievement(achievementId) {
        this.unlockedAchievements.add(achievementId);
        this.saveUnlockedAchievements();
        console.log(`Achievement unlocked: ${achievementId}`);
        // Optionally, trigger a notification or visual feedback
    }

    recordSpin(winningNumber, netProfit) {
        // Créer un objet gameResult pour les vérifications d'achievements
        const gameResult = {
            winningNumber: winningNumber,
            profit: netProfit,
            totalBetAmount: Math.abs(netProfit) // Approximation basée sur le profit net
        };

        // Mettre à jour les statistiques
        this.updateGameStats(gameResult);

        // Vérifier les achievements
        this.checkAchievements(gameResult);

        // Retourner les nouveaux achievements débloqués
        return this.getRecentlyUnlocked();
    }

    getRecentlyUnlocked() {
        // Cette méthode pourrait être améliorée pour tracker les achievements récemment débloqués
        // Pour l'instant, on retourne un tableau vide
        return [];
    }

    getAchievements() {
        return this.achievements.map(achievement => ({
            ...achievement,
            unlocked: this.isUnlocked(achievement.id)
        }));
    }
}

// Exportation par défaut de la classe AchievementSystem
export default AchievementSystem;

// Si une instance nommée est nécessaire, elle doit être créée et exportée séparément, ou dans un autre fichier.
// Par exemple, si vous avez besoin d'une instance globale, vous pourriez faire :
// // export const achievementSystem = new AchievementSystem();
// Mais cela doit être fait avec précaution pour éviter les conflits de noms si la classe est déjà exportée par défaut.