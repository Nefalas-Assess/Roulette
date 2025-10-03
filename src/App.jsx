import { useState, useEffect, useRef } from 'react';
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
  const [spinResult, setSpinResult] = useState(null);
  
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

  // Ref pour éviter les doubles appels
  const spinTimeoutRef = useRef(null);
  const isSpinningRef = useRef(false);

  // Chargement initial
  useEffect(() => {
    setBalance(wallet.getBalance());
    checkTimers();
  }, [wallet]);

  // Système de timer automatique
  useEffect(() => {
    let interval;
    
    // Ne démarrer le timer que si aucun spin n'est en cours
    if (!isSpinning && !isSpinningRef.current && canBet) {
      interval = setInterval(() => {
        setTimeUntilSpin(prev => {
          if (prev <= 1) {
            // Vérifier à nouveau avant de lancer
            if (!isSpinningRef.current && !isSpinning) {
              const bets = bettingManager.getBets();
              if (bets.length > 0) {
                handleAutoSpin();
              }
            }
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Si un spin est en cours, réinitialiser le timer
      setTimeUntilSpin(30);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpinning, canBet]);

  // Cleanup lors du démontage
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  // Vérification des timers pour les récompenses
  const checkTimers = () => {
    const now = Date.now();
    const lastHourlyClaim = parseInt(localStorage.getItem('lastHourlyClaim') || '0');
    const lastAdWatch = parseInt(localStorage.getItem('lastAdWatch') || '0');
    
    setCanClaimHourly(now - lastHourlyClaim > 3600000);
    setCanWatchAd(now - lastAdWatch > 300000);
  };

  // Fonction pour ajouter un pari (NE PLUS DÉBITER ICI)
  const handlePlaceBet = (betType, betValue, amount = selectedAmount) => {
    if (isSpinning || !canBet) return;

    const validation = wallet.validateTransaction(amount);
    if (!validation.valid) {
      setMessage(`❌ ${validation.reason}`);
      return;
    }

    try {
      bettingManager.addBet(betType, betValue, amount);
      // NE PLUS DÉBITER LE SOLDE ICI
      setActiveBets(bettingManager.getBets());
      setMessage(`✅ Pari ajouté : ${formatBetDisplay(betType, betValue)} (${amount} jetons)`);
      console.log(`[LOG] Pari ajouté: Type=${betType}, Valeur=${betValue}, Montant=${amount}, Solde actuel=${wallet.getBalance()}`);
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    }
  };

  // Fonction pour retirer un pari (NE PLUS REMBOURSER ICI)
  const handleRemoveBet = (betId) => {
    const removedBet = bettingManager.removeBet(betId);
    if (removedBet) {
      // NE PLUS REMBOURSER LE SOLDE ICI
      setActiveBets(bettingManager.getBets());
      setMessage(`🔄 Pari retiré : ${removedBet.amount} jetons`);
      console.log(`[LOG] Pari retiré: Type=${removedBet.type}, Valeur=${removedBet.value}, Montant=${removedBet.amount}, Solde actuel=${wallet.getBalance()}`);
    }
  };

  // Fonction pour effacer tous les paris (NE PLUS REMBOURSER ICI)
  const handleClearBets = () => {
    const totalRefund = bettingManager.getTotalBetAmount();
    bettingManager.clearBets();
    // NE PLUS REMBOURSER LE SOLDE ICI
    setActiveBets([]);
    setMessage(`🔄 Tous les paris effacés`);
    console.log(`[LOG] Tous les paris effacés. Solde actuel=${wallet.getBalance()}`);
  };

  // Fonction automatique de spin - PROTECTION RENFORCÉE
  const handleAutoSpin = () => {
    // PROTECTION DOUBLE CONTRE LES APPELS MULTIPLES
    if (isSpinningRef.current || isSpinning) {
      console.log('[LOG] Spin déjà en cours, appel ignoré');
      return;
    }

    const bets = bettingManager.getBets();
    if (bets.length === 0) {
      setTimeUntilSpin(30);
      return;
    }

    // Vérifier le solde AVANT de débiter
    const totalBet = bettingManager.getTotalBetAmount();
    const validation = wallet.validateTransaction(totalBet);
    if (!validation.valid) {
      setMessage(`❌ ${validation.reason}`);
      bettingManager.clearBets();
      setActiveBets([]);
      return;
    }

    // MARQUER LE SPIN COMME EN COURS IMMÉDIATEMENT
    isSpinningRef.current = true;
    setIsSpinning(true);
    setCanBet(false);
    setMessage("🎰 La roue tourne...");
    console.log(`[LOG] Début du spin. Paris actifs: ${JSON.stringify(bets)}`);

    // DÉBITER LE SOLDE MAINTENANT
    wallet.deductBalance(totalBet);
    setBalance(wallet.getBalance());
    console.log(`[LOG] Solde débité: ${totalBet} jetons, Nouveau solde: ${wallet.getBalance()}`);

    // Générer UN SEUL résultat
    const result = spinWheel();
    setSpinResult(result);
    
    // Stocker la référence du timeout
    spinTimeoutRef.current = setTimeout(() => {
      // Calcul des gains
      const winnings = bettingManager.calculateTotalWinnings(result.number);
      const netProfit = winnings - totalBet;

      // AJOUTER LES GAINS SI IL Y EN A
      if (winnings > 0) {
        wallet.addBalance(winnings);
        console.log(`[LOG] Gains ajoutés: ${winnings} jetons`);
      }
      
      setTotalProfitLoss(prev => {
        const newProfitLoss = prev + netProfit;
        localStorage.setItem("totalProfitLoss", newProfitLoss.toString());
        return newProfitLoss;
      });
      setBalance(wallet.getBalance());

      // Statistiques pour les succès
      const unlockedAchievements = achievementSystem.recordSpin(result.number, netProfit, bettingManager.getLastBetType(), bettingManager.getLastBetValue());
      if (unlockedAchievements && unlockedAchievements.length > 0) {
        setAchievements(prev => [...prev, ...unlockedAchievements]);
      }

      console.log(`[LOG] Résultat du spin: Numéro=${result.number}, Couleur=${result.color}`);
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
        number: result.number,
        color: result.color,
        winnings: winnings,
        netProfit: netProfit,
        bets: [...bets]
      });

      // Nettoyage
      bettingManager.clearBets();
      setActiveBets([]);
      isSpinningRef.current = false;
      setIsSpinning(false);
      setCanBet(true);
      setTimeUntilSpin(30);
      spinTimeoutRef.current = null;
    }, 10000);
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

  // Fonction utilitaire pour vérifier si un pari est actif
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

    tableLayout.push(
      <div key="zero-row" className="roulette-row zero-row">
        <div className="bet-cell zero" onClick={() => handlePlaceBet('STRAIGHT_UP', 0)}>0{hasActiveBet('STRAIGHT_UP', 0) && <div className="bet-indicator"></div>}</div>
        <div className="bet-cell double-zero" onClick={() => handlePlaceBet('STRAIGHT_UP', '00')}>00{hasActiveBet('STRAIGHT_UP', '00') && <div className="bet-indicator"></div>}</div>
      </div>
    );

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
        <div className="wheel-section">
          <RouletteWheel 
            isSpinning={isSpinning}
            result={spinResult}
            winningNumber={spinResult?.number}
          />
        </div>

        <div className="betting-section">
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
                    {activeBets.length > 0 && (
                      <div className="timer-note">Total misé : {bettingManager.getTotalBetAmount()} 🪙</div>
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

          {renderBettingTable(activeBets)}
        </div>

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