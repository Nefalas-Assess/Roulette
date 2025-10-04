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
            {
                id: 'red_or_black_win',
                name: 'Rouge ou noir',
                description: 'Gagner en misant sur une couleur',
                icon: '🎨',
                category: 'betting',
                condition: (gameResult, stats) => ['RED', 'BLACK'].includes(gameResult.betType) && gameResult.profit > 0
            },
            {
                id: 'even_odd_win',
                name: 'Pair ou impair',
                description: 'Gagner en misant sur la parité',
                icon: '⚖️',
                category: 'betting',
                condition: (gameResult, stats) => ['EVEN', 'ODD'].includes(gameResult.betType) && gameResult.profit > 0
            },
            {
                id: 'low_win',
                name: '1 à 18',
                description: 'Gagner en misant sur la première moitié des numéros',
                icon: '📉',
                category: 'betting',
                condition: (gameResult, stats) => gameResult.betType === 'LOW' && gameResult.profit > 0
            },
            {
                id: 'high_win',
                name: '19 à 36',
                description: 'Gagner en misant sur la seconde moitié des numéros',
                icon: '📈',
                category: 'betting',
                condition: (gameResult, stats) => gameResult.betType === 'HIGH' && gameResult.profit > 0
            },
            {
                id: 'martingale_master',
                name: 'L\'art de la martingale',
                description: 'Gagner après avoir doublé sa mise suite à une perte',
                icon: '🔄',
                category: 'betting',
                condition: (gameResult, stats) => {
                    // Cette condition nécessiterait un suivi des mises précédentes
                    // Pour l'instant, on simule avec une chance aléatoire
                    return gameResult.profit > 0 && stats.totalGames >= 10 && Math.random() > 0.7;
                }
            },

            // 🍀 Gains
            {
                id: 'jackpot_precision',
                name: 'Jackpot de précision',
                description: 'Taper juste sur un numéro plein (straight up)',
                icon: '🎯',
                category: 'rare',
                condition: (gameResult, stats) => gameResult.betType === 'STRAIGHT_UP' && gameResult.profit > 0
            },
            {
                id: 'double_zero_magic',
                name: 'Double zéro magique',
                description: 'Gagner en misant sur le 00',
                icon: '💚',
                category: 'rare',
                condition: (gameResult, stats) => gameResult.betType === 'STRAIGHT_UP' && gameResult.betNumber === '00' && gameResult.profit > 0
            },
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
                id: 'lucky_streak_10',
                name: 'Chance insolente',
                description: 'Gagner 10 paris consécutifs',
                icon: '🍀',
                category: 'rare',
                condition: (gameResult, stats) => stats.consecutiveWins >= 10
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
            id: 'small_player',
            name: 'Petit joueur',
            description: 'Doubler sa mise initiale',
            icon: '💰',
            category: 'winnings',
            condition: (gameResult, stats) => {
                const initialBalance = 1000; // Balance de départ
                return wallet.getBalance() >= initialBalance * 2;
            }
        },
        {
            id: 'big_winner',
            name: 'Grand gagnant',
            description: 'Atteindre un bénéfice de 1 000 crédits',
            icon: '💎',
            category: 'winnings',
            condition: (gameResult, stats) => {
                const totalProfit = gameHistory.reduce((sum, game) => sum + game.netProfit, 0);
                return totalProfit >= 1000;
            }
        },
        {
            id: 'millionaire',
            name: 'Millionnaire',
            description: 'Cumuler 1 000 000 de crédits',
            icon: '🤑',
            category: 'winnings',
            condition: (gameResult, stats) => wallet.getBalance() >= 1000000
        },
        {
            id: 'all_in_win',
            name: 'All-in',
            description: 'Miser tout son solde d\'un coup et gagner',
            icon: '🎲',
            category: 'winnings',
            condition: (gameResult, stats) => {
                // Cette condition nécessiterait de tracker si le dernier pari était un all-in
                return gameResult.totalBetAmount >= wallet.getBalance() * 0.95 && gameResult.profit > 0;
            }
        },
        {
            id: 'phoenix_rise',
            name: 'Retour du phénix',
            description: 'Revenir à un solde positif après être tombé à 0',
            icon: '🔥',
            category: 'winnings',
            condition: (gameResult, stats) => {
                // Nécessite de tracker le solde minimum atteint
                const minBalance = parseInt(localStorage.getItem('minBalance') || '1000');
                return minBalance <= 0 && wallet.getBalance() > 0;
            }
        },

        // 🔥 Achievements spéciaux (nouveaux)
        {
            id: 'red_blood',
            name: 'Rouge sang',
            description: 'Gagner 10 mises consécutives sur le rouge',
            icon: '🔴',
            category: 'special',
            condition: (gameResult, stats) => {
                // Nécessite un suivi spécifique des séries de couleurs
                return stats.consecutiveRedWins >= 10;
            }
        },
        {
            id: 'total_black',
            name: 'Noir total',
            description: 'Gagner 10 mises consécutives sur le noir',
            icon: '⚫',
            category: 'special',
            condition: (gameResult, stats) => {
                // Nécessite un suivi spécifique des séries de couleurs
                return stats.consecutiveBlackWins >= 10;
            }
        },
        {
            id: 'collector',
            name: 'Collectionneur',
            description: 'Avoir gagné au moins une fois sur chaque type de mise',
            icon: '📚',
            category: 'special',
            condition: (gameResult, stats) => {
                const betTypesWon = new Set(stats.betTypesWon || []);
                const requiredTypes = ['STRAIGHT_UP', 'SPLIT', 'CORNER', 'DOZEN', 'COLUMN', 'RED', 'BLACK', 'EVEN', 'ODD', 'LOW', 'HIGH'];
                return requiredTypes.every(type => betTypesWon.has(type));
            }
        },
        {
            id: 'carpet_sniper',
            name: 'Sniper du tapis',
            description: 'Avoir gagné au moins une fois sur chaque numéro (0, 00, 1–36)',
            icon: '🎯',
            category: 'special',
            condition: (gameResult, stats) => {
                const numbersWon = new Set(stats.numbersWon || []);
                const allNumbers = [0, '00', ...Array.from({length: 36}, (_, i) => i + 1)];
                return allNumbers.every(num => numbersWon.has(num));
            }
        },
        {
            id: 'immortal',
            name: 'Immortel',
            description: 'Jouer 100 parties sans jamais tomber à zéro',
            icon: '💀',
            category: 'special',
            condition: (gameResult, stats) => {
                const gamesWithoutZero = parseInt(localStorage.getItem('gamesWithoutZero') || '0');
                return gamesWithoutZero >= 100;
            }
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

    recordSpin(winningNumber, netProfit, betType = null, betNumber = null) {
        // Créer un objet gameResult pour les vérifications d'achievements
        const gameResult = {
            winningNumber: winningNumber,
            profit: netProfit,
            totalBetAmount: Math.abs(netProfit), // Approximation basée sur le profit net
            betType: betType,
            betNumber: betNumber
        };

        // Mettre à jour les statistiques
        this.updateGameStats(gameResult);

        // Vérifier les achievements et retourner ceux qui sont débloqués
        return this.checkAchievements(gameResult);
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
