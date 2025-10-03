import { useState, useEffect } from 'react';
import RouletteWheel from './RouletteWheel';
import { spinWheel } from './rouletteLogic';
import { WalletSystem } from './walletSystem';
import { BettingManager, BET_TYPES, BET_AMOUNTS, BETTING_AREAS, RED_NUMBERS, BLACK_NUMBERS } from './bettingSystem';
import { AchievementSystem } from './achievementSystem';
import { AdSystem } from './adSystem';
import './App.css';

function App() {
  // Initialisation des systèmes
  const [wallet] = useState(() => new WalletSystem());
  const [bettingManager] = useState(() => new BettingManager());
  const [achievementSystem] = useState(() => new AchievementSystem());
  const [adSystem] = useState(() => new AdSystem());
  const [totalProfitLoss, setTotalProfitLoss] = useState(() => {
    const savedProfitLoss = localStorage.getItem('totalProfitLoss');
    return savedProfitLoss ? parseInt(savedProfitLoss) : 0;
  });

  // États du jeu
  const [balance, setBalance] = useState(wallet.getBalance());
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [winningNumber, setWinningNumber] = useState(null);
  
  // États pour le système automatique
  const [timeUntilSpin, setTimeUntilSpin] = useState(30);
  const [canBet, setCanBet] = useState(true);
  
  // États des paris
  const [selectedAmount, setSelectedAmount] = useState(BET_AMOUNTS[0]);
  const [activeBets, setActiveBets] = useState([]);
  
  // États des résultats
  const [lastResult, setLastResult] = useState(null);
  const [message, setMessage] = useState('');

  // États des succès et publicités
  const [achievements, setAchievements] = useState([]);
  const [canClaimHourly, setCanClaimHourly] = useState(true);
  const [canWatchAd, setCanWatchAd] = useState(true);

  // Chargement initial
  useEffect(() => {
    setBalance(wallet.getBalance());
    checkTimers();
  }, [wallet]);

  // Système de timer automatique
  useEffect(() => {
    let interval;
    
    if (!isSpinning && canBet) {
      interval = setInterval(() => {
        setTimeUntilSpin(prev => {
          if (prev <= 1) {
            // Lancer automatiquement si il y a des paris
            const bets = bettingManager.getBets();
            if (bets.length > 0) {
              handleAutoSpin();
            }
            return 30; // Reset le timer
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpinning, canBet]);

  // Vérification des timers pour les récompenses
  const checkTimers = () => {
    const now = Date.now();
    const lastHourlyClaim = parseInt(localStorage.getItem('lastHourlyClaim') || '0');
    const lastAdWatch = parseInt(localStorage.getItem('lastAdWatch') || '0');
    
    setCanClaimHourly(now - lastHourlyClaim > 3600000); // 1 heure
    setCanWatchAd(now - lastAdWatch > 300000); // 5 minutes
  };

  // Fonction pour ajouter un pari
  const handlePlaceBet = (betType, betValue, amount = selectedAmount) => {
    if (isSpinning || !canBet) return;

    // Validation du solde
    const validation = wallet.validateTransaction(amount);
    if (!validation.valid) {
      setMessage(`❌ ${validation.reason}`);
      return;
    }

    try {
      bettingManager.addBet(betType, betValue, amount);
      
      // Déduction du solde
      wallet.deductBalance(amount);
      setBalance(wallet.getBalance());
      
      // Mise à jour de l'affichage
      setActiveBets(bettingManager.getBets());
      setMessage(`✅ Pari ajouté : ${formatBetDisplay(betType, betValue)} (${amount} jetons)`);
      console.log(`[LOG] Pari ajouté: Type=${betType}, Valeur=${betValue}, Montant=${amount}, Solde actuel=${wallet.getBalance()}`);
      
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    }
  };

  // Fonction pour retirer un pari
  const handleRemoveBet = (betId) => {
    const removedBet = bettingManager.removeBet(betId);
    if (removedBet) {
      wallet.addBalance(removedBet.amount);
      setBalance(wallet.getBalance());
      setActiveBets(bettingManager.getBets());
      setMessage(`🔄 Pari retiré : ${removedBet.amount} jetons remboursés`);
      console.log(`[LOG] Pari retiré: Type=${removedBet.type}, Valeur=${removedBet.value}, Montant=${removedBet.amount}, Solde actuel=${wallet.getBalance()}`);
    }
  };

  // Fonction pour effacer tous les paris
  const handleClearBets = () => {
    const totalRefund = bettingManager.getTotalBetAmount();
    bettingManager.clearBets();
    wallet.addBalance(totalRefund);
    setBalance(wallet.getBalance());
    setActiveBets([]);
    setMessage(`🔄 Tous les paris effacés : ${totalRefund} jetons remboursés`);
    console.log(`[LOG] Tous les paris effacés. Montant remboursé: ${totalRefund}, Solde actuel=${wallet.getBalance()}`);
  };

  // Fonction automatique de spin
  const handleAutoSpin = () => {
    if (isSpinning) return;

    const bets = bettingManager.getBets();
    if (bets.length === 0) {
      setTimeUntilSpin(30); // Reset le timer si pas de paris
      return;
    }

    setIsSpinning(true);
    setCanBet(false);
    setMessage("🎰 La roue tourne...");
    console.log(`[LOG] Début du spin. Paris actifs: ${JSON.stringify(bets)}`);

    // Simulation du spin
    const spinResult = spinWheel();
    
    setTimeout(() => {
      setResult(spinResult);
      setWinningNumber(spinResult.number);

      // Calcul des gains
      const winnings = bettingManager.calculateTotalWinnings(spinResult.number);
      const totalBet = bettingManager.getTotalBetAmount();
      const netProfit = winnings - totalBet;

      // Mise à jour du solde
      if (winnings > 0) {
        wallet.addBalance(winnings);
      }
      setTotalProfitLoss(prev => {
        const newProfitLoss = prev + netProfit;
        localStorage.setItem("totalProfitLoss", newProfitLoss.toString());
        return newProfitLoss;
      });
      setBalance(wallet.getBalance());

      // Statistiques pour les succès
      const unlockedAchievements = achievementSystem.recordSpin(spinResult.number, netProfit, bettingManager.getLastBetType(), bettingManager.getLastBetValue());
      if (unlockedAchievements && unlockedAchievements.length > 0) {
        setAchievements(prev => [...prev, ...unlockedAchievements]);
      }

      console.log(`[LOG] Résultat du spin: Numéro=${spinResult.number}, Couleur=${spinResult.color}`);
      console.log(`[LOG] Gains calculés: Total des gains=${winnings}, Profit net=${netProfit}, Solde final=${wallet.getBalance()}`);

      // Message de résultat
      if (netProfit > 0) {
        setMessage(`🎉 Victoire ! Vous avez gagné ${netProfit} jetons !`);
      } else if (netProfit === 0) {
        setMessage(`😐 Égalité ! Aucun gain, aucune perte.`);
      } else {
        setMessage(`😢 Perdu ! Vous avez perdu ${Math.abs(netProfit)} jetons.`);
      }

      // Sauvegarde du résultat
      setLastResult({
        number: spinResult.number,
        color: spinResult.color,
        winnings: winnings,
        netProfit: netProfit,
        bets: [...bets]
      });

      // Nettoyage des paris et reset du système
      bettingManager.clearBets();
      setActiveBets([]);
      setIsSpinning(false);
      setCanBet(true);
      setTimeUntilSpin(30); // Reset le timer pour la prochaine partie
    }, 10000); // 10 secondes d'animation
  };

  // Récompense publicitaire
  const handleWatchAd = () => {
    if (!canWatchAd) {
      setMessage('📺 Publicité déjà vue. Attendez 5 minutes.');
      return;
    }

    setMessage('📺 Chargement de la publicité...');
    
    adSystem.loadAd().then(() => {
      return adSystem.showAd();
    }).then(() => {
      const reward = wallet.claimAdReward();
      setBalance(wallet.getBalance());
      setCanWatchAd(false);
      localStorage.setItem('lastAdWatch', Date.now().toString());
      setMessage(`🎬 Merci ! Vous avez reçu ${reward} jetons !`);
      
      setTimeout(() => setCanWatchAd(true), 300000);
    }).catch(error => {
      setMessage(`❌ ${error.message}`);
    });
  };

  // Fonction utilitaire pour vérifier si un pari est actif sur une cellule donnée
  const hasActiveBet = (betType, betValue) => {
    return activeBets.some(bet => bet.type === betType && bet.value === betValue);
  };

  // Fonction utilitaire pour formater les types de paris
  const formatBetDisplay = (type, value) => {
    if (type === 'STRAIGHT_UP') {
      return `N° ${value}`;
    }
    const labels = {
      'RED': 'Rouge',
      'BLACK': 'Noir',
      'EVEN': 'Pair',
      'ODD': 'Impair',
      'LOW': '1-18',
      'HIGH': '19-36',
      'FIRST_DOZEN': '1er 12',
      'SECOND_DOZEN': '2ème 12',
      'THIRD_DOZEN': '3ème 12'
    };
    return labels[value] || value;
  };

  const renderBettingTable = (activeBets) => {
    const tableLayout = [];

    // Row for 0 and 00
    tableLayout.push(
      <div key="zero-row" className="roulette-row zero-row">
        <div className="bet-cell zero" onClick={() => handlePlaceBet('STRAIGHT_UP', 0)}>0{hasActiveBet('STRAIGHT_UP', 0) && <div className="bet-indicator"></div>}</div>
        <div className="bet-cell double-zero" onClick={() => handlePlaceBet('STRAIGHT_UP', '00')}>00{hasActiveBet('STRAIGHT_UP', '00') && <div className="bet-indicator"></div>}</div>
      </div>
    );

    // Main numbers 1-36 (all in one row)
    const allNumbers = [];
    for (let i = 1; i <= 36; i++) {
      const isRed = RED_NUMBERS.includes(i);
      const isBlack = BLACK_NUMBERS.includes(i);
      allNumbers.push(
        <div 
          key={i}
          className={`bet-cell number ${isRed ? 'red' : ''} ${isBlack ? 'black' : ''}`}
          onClick={() => handlePlaceBet('STRAIGHT_UP', i)}
        >
          {i}
          {hasActiveBet('STRAIGHT_UP', i) && <div className="bet-indicator"></div>}
        </div>
      );
    }
    tableLayout.push(
      <div key="main-betting-area" className="main-betting-area">
        <div className="roulette-row all-numbers-row">{allNumbers}</div>
        <div className="roulette-row dozen-row">
          <div className="bet-cell dozen" onClick={() => handlePlaceBet("DOZEN", "FIRST_DOZEN")}>1st 12{hasActiveBet("DOZEN", "FIRST_DOZEN") && <div className="bet-indicator"></div>}</div>
          <div className="bet-cell dozen" onClick={() => handlePlaceBet("DOZEN", "SECOND_DOZEN")}>2nd 12{hasActiveBet("DOZEN", "SECOND_DOZEN") && <div className="bet-indicator"></div>}</div>
          <div className="bet-cell dozen" onClick={() => handlePlaceBet("DOZEN", "THIRD_DOZEN")}>3rd 12{hasActiveBet("DOZEN", "THIRD_DOZEN") && <div className="bet-indicator"></div>}</div>
        </div>
      </div>
    );

    // Simple chances (1-18, Even, Red, Black, Odd, 19-36)
    tableLayout.push(
      <div key="simple-chance-row" className="roulette-row simple-chance-row">
        <div className="bet-cell simple-chance" onClick={() => handlePlaceBet('LOW', 'LOW')}>1-18{hasActiveBet('LOW', 'LOW') && <div className="bet-indicator"></div>}</div>
        <div className="bet-cell simple-chance" onClick={() => handlePlaceBet('EVEN', 'EVEN')}>EVEN{hasActiveBet('EVEN', 'EVEN') && <div className="bet-indicator"></div>}</div>
        <div className="bet-cell simple-chance red-diamond" onClick={() => handlePlaceBet('RED', 'RED')}>♦{hasActiveBet('RED', 'RED') && <div className="bet-indicator"></div>}</div>
        <div className="bet-cell simple-chance black-diamond" onClick={() => handlePlaceBet('BLACK', 'BLACK')}>♠{hasActiveBet('BLACK', 'BLACK') && <div className="bet-indicator"></div>}</div>
        <div className="bet-cell simple-chance" onClick={() => handlePlaceBet('ODD', 'ODD')}>ODD{hasActiveBet('ODD', 'ODD') && <div className="bet-indicator"></div>}</div>
        <div className="bet-cell simple-chance" onClick={() => handlePlaceBet('HIGH', 'HIGH')}>19-36{hasActiveBet('HIGH', 'HIGH') && <div className="bet-indicator"></div>}</div>
      </div>
    );

    return <div className="roulette-table">{tableLayout}</div>;
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-right">
          <div className="balance-display">
            <span className="balance-amount">{balance} 🪙</span>
          </div>
          <div className="profit-loss-display">
            <span className="profit-loss-amount" style={{ color: totalProfitLoss >= 0 ? 'green' : 'red' }}>
              P&L: {totalProfitLoss} 🪙
            </span>
          </div>
          <button 
            className="reward-btn ad-btn"
            onClick={handleWatchAd}
            disabled={!canWatchAd}
          >
            📺 Regarder une pub (50 🪙)
          </button>
          <button 
            className="test-btn"
            onClick={() => {
              wallet.addBalance(10000);
              setBalance(wallet.getBalance());
              setMessage('🧪 Test: 10000 jetons ajoutés !');
            }}
          >
            🧪 Test +10k
          </button>
        </div>
      </header>

      <main className="app-main">
        {/* Affichage du timer automatique (déplacé au-dessus de la roue) */}


        {/* Section de la roue */}
        <div className="wheel-section">
          <RouletteWheel 
            isSpinning={isSpinning}
            result={result}
            winningNumber={winningNumber}
          />
        </div>

        {/* Section de pari */}
        <div className="betting-section">
          {/* Sélection du montant */}
          <div className="amount-selector">
                    <div className="timer-display-container">
          <div className="timer-display">
            {isSpinning ? (
              <div className="spinning-message">🎰 La roue tourne...</div>
            ) : (
              <div className="countdown-timer">
                <div className="timer-label">Prochaine partie dans :</div>
                <div className="timer-value">{timeUntilSpin}s</div>
                {activeBets.length === 0 && (
                  <div className="timer-note">Placez vos paris !</div>
                )}
              </div>
            )}
          </div>
        </div>
            <div className="amount-buttons">
              {BET_AMOUNTS.map(amount => (
                <button
                  key={amount}
                  className={`amount-btn ${selectedAmount === amount ? 'selected' : ''}`}
                  onClick={() => setSelectedAmount(amount)}
                >
                  {amount} 🪙
                </button>
              ))}
              <button
                key="all-in"
                className={`amount-btn ${selectedAmount === balance ? 'selected' : ''}`}
                onClick={() => setSelectedAmount(balance)}
                disabled={balance === 0 || isSpinning}
              >
                All in 🪙
              </button>
            </div>
          </div>

          {/* Table de paris cliquable */}
          {renderBettingTable(activeBets)}
        </div>

        {/* Succès débloqués */}
        {achievements.length > 0 && (
          <div className="achievements-section">
            <h3>🏆 Succès débloqués</h3>
            <div className="achievements-list">
              {achievements.slice(-3).map((achievement, index) => (
                <div key={index} className="achievement-item">
                  <strong>{achievement.name}</strong>
                  <p>{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;