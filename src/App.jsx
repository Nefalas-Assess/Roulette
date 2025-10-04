import { useState, useEffect, useRef } from 'react';
import RouletteWheel from './RouletteWheel';
import { spinWheel } from './rouletteLogic';
import { WalletSystem } from './walletSystem';
import { BettingManager, BET_TYPES, BET_AMOUNTS, BETTING_AREAS, RED_NUMBERS, BLACK_NUMBERS } from './bettingSystem';
import { AchievementSystem } from './achievementSystem';
import { AdSystem } from './adSystem';
import HistoryModal from './HistoryModal';
import AchievementsModal from './AchievementsModal';
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
  const [timeUntilSpin, setTimeUntilSpin] = useState(15);
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
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [allAchievements, setAllAchievements] = useState([]);

  // Nouveaux états pour l'historique
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [gameHistory, setGameHistory] = useState(() => {
    const savedHistory = localStorage.getItem('gameHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  // Nouvel état pour afficher le bouton de pub
  const [showAdButton, setShowAdButton] = useState(false);

  // Ref pour éviter les doubles appels
  const spinTimeoutRef = useRef(null);
  const isSpinningRef = useRef(false);

  // Chargement initial
  useEffect(() => {
    setBalance(wallet.getBalance());
    checkTimers();
    loadAllAchievements();
  }, [wallet]);

  // Charger tous les achievements
  const loadAllAchievements = () => {
    const allAchievements = achievementSystem.getAchievements();
    setAllAchievements(allAchievements);
  };

  // Fonction pour sauvegarder l'historique
  const saveGameHistory = (result) => {
    const newHistory = [{
      id: Date.now(),
      number: result.number,
      color: result.color,
      timestamp: new Date().toLocaleString(),
      totalBet: bettingManager.getTotalBetAmount(),
      winnings: result.winnings || 0,
      netProfit: result.netProfit || 0,
      bets: activeBets.map(bet => ({
        type: bet.type,
        value: bet.value,
        amount: bet.amount
      }))
    }, ...gameHistory.slice(0, 99)]; // Garder les 100 derniers résultats
    
    setGameHistory(newHistory);
    localStorage.setItem('gameHistory', JSON.stringify(newHistory));
  };

  // Système de timer automatique - CORRIGÉ
  useEffect(() => {
    let interval;
    
    if (!isSpinning && !isSpinningRef.current && canBet) {
      interval = setInterval(() => {
        setTimeUntilSpin(prev => {
          if (prev <= 1) {
            // Vérifier à nouveau avant de lancer
            if (!isSpinningRef.current && !isSpinning) {
              console.log('[TIMER] Lancement automatique du spin');
              handleAutoSpin();
            }
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
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

  // Fonction utilitaire pour obtenir le montant d'un pari spécifique (SOLUTION DE SECOURS)
  const getBetAmount = (betType, betValue) => {
    // Vérifier si la méthode existe, sinon utiliser une solution alternative
    if (typeof bettingManager.getBetAmount === 'function') {
      return bettingManager.getBetAmount(betType, betValue);
    } else {
      // Solution alternative : parcourir les paris manuellement
      const bet = bettingManager.getBets().find(bet => 
        bet.type === betType && bet.value === betValue
      );
      return bet ? bet.amount : 0;
    }
  };

  // Fonction pour ajouter un pari (MODIFIÉE POUR MISES MULTIPLES)
  const handlePlaceBet = (betType, betValue, amount = selectedAmount) => {
    if (isSpinning || !canBet) return;

    // MODIFICATION : Validation du montant avant de continuer
    if (amount <= 0 || !Number.isInteger(amount)) {
      setMessage(`❌ Montant de pari invalide: ${amount}`);
      return;
    }

    const validation = wallet.validateTransaction(amount);
    if (!validation.valid) {
      setMessage(`❌ ${validation.reason}`);
      return;
    }

    try {
      // Vérifier s'il existe déjà un pari du même type et valeur
      const existingBets = bettingManager.getBets();
      const existingBetIndex = existingBets.findIndex(bet => 
        bet.type === betType && bet.value === betValue
      );

      if (existingBetIndex > -1) {
        // Si le pari existe déjà, créer un nouveau pari séparé pour la même case
        // Cela permet d'avoir plusieurs paris sur la même case
        bettingManager.addBet(betType, betValue, amount);
      } else {
        // Créer un nouveau pari
        bettingManager.addBet(betType, betValue, amount);
      }
      
      setActiveBets(bettingManager.getBets());
      
      // Obtenir le montant total misé sur ce pari spécifique
      const totalBetOnThis = getBetAmount(betType, betValue);
      setMessage(`✅ Pari ajouté : ${formatBetDisplay(betType, betValue)} (${totalBetOnThis} jetons au total)`);
      
      console.log(`[LOG] Pari ajouté: Type=${betType}, Valeur=${betValue}, Montant=${amount}, Total sur ce pari=${totalBetOnThis}, Solde actuel=${wallet.getBalance()}`);
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    }
  };

  // Fonction pour retirer un pari
  const handleRemoveBet = (betId) => {
    const removedBet = bettingManager.removeBet(betId);
    if (removedBet) {
      setActiveBets(bettingManager.getBets());
      setMessage(`🔄 Pari retiré : ${removedBet.amount} jetons`);
      console.log(`[LOG] Pari retiré: Type=${removedBet.type}, Valeur=${removedBet.value}, Montant=${removedBet.amount}, Solde actuel=${wallet.getBalance()}`);
    }
  };

  // Fonction pour réduire un pari (NOUVELLE FONCTION)
  const handleReduceBet = (betType, betValue, amount = selectedAmount) => {
    if (isSpinning || !canBet) return;

    // MODIFICATION : Validation du montant
    if (amount <= 0 || !Number.isInteger(amount)) {
      setMessage(`❌ Montant de réduction invalide: ${amount}`);
      return;
    }

    // Solution alternative puisque bettingManager.reduceBet n'existe pas
    const existingBets = bettingManager.getBets();
    const betToReduce = existingBets.find(bet => 
      bet.type === betType && bet.value === betValue
    );

    if (betToReduce) {
      if (betToReduce.amount > amount) {
        // Réduire le montant du pari
        betToReduce.amount -= amount;
        setActiveBets([...existingBets]); // Forcer le re-render
        const totalBetOnThis = getBetAmount(betType, betValue);
        setMessage(`🔽 Pari réduit : ${formatBetDisplay(betType, betValue)} (${totalBetOnThis} jetons restants)`);
      } else {
        // Supprimer le pari si le montant à retirer est >= au montant actuel
        handleRemoveBet(betToReduce.id);
      }
    }
  };

  // Fonction pour effacer tous les paris
  const handleClearBets = () => {
    bettingManager.clearBets();
    setActiveBets([]);
    setMessage(`🔄 Tous les paris effacés`);
    console.log(`[LOG] Tous les paris effacés. Solde actuel=${wallet.getBalance()}`);
  };

  // FONCTION AUTOMATIQUE DE SPIN - MODIFIÉE
  const handleAutoSpin = () => {
    // PROTECTION DOUBLE CONTRE LES APPELS MULTIPLES
    if (isSpinningRef.current || isSpinning) {
      console.log('[LOG] Spin déjà en cours, appel ignoré');
      return;
    }

    const bets = bettingManager.getBets();
    if (bets.length === 0) {
      setTimeUntilSpin(15);
      setMessage("⏰ Aucun pari placé. Le timer a été réinitialisé.");
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

    // Générer le résultat MAINTENANT
    const result = spinWheel();
    console.log(`[LOG] Résultat généré: ${result.number} ${result.color}`);

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

    // Stocker la référence du timeout
    spinTimeoutRef.current = setTimeout(() => {
      // DÉCLENCHER L'ANIMATION DE LA ROULETTE MAINTENANT
      setSpinResult(result);
      
      // Attendre que l'animation se termine (5 secondes) avant de calculer les gains
      setTimeout(() => {
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

        // Mettre à jour les succès
        achievementSystem.recordSpin(result.number, netProfit, bettingManager.getLastBetType(), bettingManager.getLastBetValue());
        
        // Sauvegarder dans l'historique
        saveGameHistory({
          number: result.number,
          color: result.color,
          winnings: winnings,
          netProfit: netProfit
        });

        // Recharger les achievements
        loadAllAchievements();

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
        
        // IMPORTANT: Reset isSpinning après l'animation
        setTimeout(() => {
          setIsSpinning(false);
          setCanBet(true);
          setTimeUntilSpin(15);
        }, 1000); // Petit délai après l'affichage du résultat
        
        spinTimeoutRef.current = null;
      }, 5000); // Attendre la fin de l'animation de la roue
    }, 1000); // 1 secondes après la fin du timer
  };

  // Récompense publicitaire
  const handleWatchAd = () => {
    if (!canWatchAd) {
      setMessage('📺 Publicité déjà vue. Attendez 5 minutes.');
      return;
    }

    setMessage('📺 Chargement de la publicité...');
    
    // Simulation de publicité
    setTimeout(() => {
      const reward = wallet.claimAdReward();
      setBalance(wallet.getBalance());
      setCanWatchAd(false);
      localStorage.setItem('lastAdWatch', Date.now().toString());
      setMessage(`🎬 Merci ! Vous avez reçu ${reward} jetons !`);
      setShowAdButton(false); // Cacher le bouton après utilisation
      setTimeout(() => setCanWatchAd(true), 300000);
    }, 2000);
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

  // Fonction pour gérer le clic sur le solde
  const handleBalanceClick = () => {
    setShowAdButton(!showAdButton);
  };

  const renderBettingTable = (activeBets) => {
    const tableLayout = [];

    tableLayout.push(
      <div key="zero-row" className="roulette-row zero-row">
        <div 
          className="bet-cell zero" 
          onClick={() => handlePlaceBet('STRAIGHT_UP', 0)}
          title={`Total misé: ${getBetAmount('STRAIGHT_UP', 0)} jetons`}
        >
          0
          {getBetAmount('STRAIGHT_UP', 0) > 0 && (
            <div className="bet-indicator">
              <span className="bet-amount">{getBetAmount('STRAIGHT_UP', 0)}</span>
            </div>
          )}
        </div>
        <div 
          className="bet-cell double-zero" 
          onClick={() => handlePlaceBet('STRAIGHT_UP', '00')}
          title={`Total misé: ${getBetAmount('STRAIGHT_UP', '00')} jetons`}
        >
          00
          {getBetAmount('STRAIGHT_UP', '00') > 0 && (
            <div className="bet-indicator">
              <span className="bet-amount">{getBetAmount('STRAIGHT_UP', '00')}</span>
            </div>
          )}
        </div>
      </div>
    );

    const allNumbers = [];
    for (let i = 1; i <= 36; i++) {
      const isRed = RED_NUMBERS.includes(i);
      const isBlack = BLACK_NUMBERS.includes(i);
      const betAmount = getBetAmount('STRAIGHT_UP', i);
      
      allNumbers.push(
        <div 
          key={i}
          className={`bet-cell number ${isRed ? 'red' : ''} ${isBlack ? 'black' : ''}`}
          onClick={() => handlePlaceBet('STRAIGHT_UP', i)}
          title={`Total misé: ${betAmount} jetons`}
        >
          {i}
          {betAmount > 0 && (
            <div className="bet-indicator">
              <span className="bet-amount">{betAmount}</span>
            </div>
          )}
        </div>
      );
    }
    tableLayout.push(
      <div key="main-betting-area" className="main-betting-area">
        <div className="roulette-row all-numbers-row">{allNumbers}</div>
        <div className="roulette-row dozen-row">
          <div 
            className="bet-cell dozen" 
            onClick={() => handlePlaceBet("DOZEN", "FIRST_DOZEN")}
            title={`Total misé: ${getBetAmount("DOZEN", "FIRST_DOZEN")} jetons`}
          >
            1st 12
            {getBetAmount("DOZEN", "FIRST_DOZEN") > 0 && (
              <div className="bet-indicator">
                <span className="bet-amount">{getBetAmount("DOZEN", "FIRST_DOZEN")}</span>
              </div>
            )}
          </div>
          <div 
            className="bet-cell dozen" 
            onClick={() => handlePlaceBet("DOZEN", "SECOND_DOZEN")}
            title={`Total misé: ${getBetAmount("DOZEN", "SECOND_DOZEN")} jetons`}
          >
            2nd 12
            {getBetAmount("DOZEN", "SECOND_DOZEN") > 0 && (
              <div className="bet-indicator">
                <span className="bet-amount">{getBetAmount("DOZEN", "SECOND_DOZEN")}</span>
              </div>
            )}
          </div>
          <div 
            className="bet-cell dozen" 
            onClick={() => handlePlaceBet("DOZEN", "THIRD_DOZEN")}
            title={`Total misé: ${getBetAmount("DOZEN", "THIRD_DOZEN")} jetons`}
          >
            3rd 12
            {getBetAmount("DOZEN", "THIRD_DOZEN") > 0 && (
              <div className="bet-indicator">
                <span className="bet-amount">{getBetAmount("DOZEN", "THIRD_DOZEN")}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    tableLayout.push(
      <div key="simple-chance-row" className="roulette-row simple-chance-row">
        <div 
          className="bet-cell simple-chance" 
          onClick={() => handlePlaceBet('LOW', 'LOW')}
          title={`Total misé: ${getBetAmount('LOW', 'LOW')} jetons`}
        >
          1-18
          {getBetAmount('LOW', 'LOW') > 0 && (
            <div className="bet-indicator">
              <span className="bet-amount">{getBetAmount('LOW', 'LOW')}</span>
            </div>
          )}
        </div>
        <div 
          className="bet-cell simple-chance" 
          onClick={() => handlePlaceBet('EVEN', 'EVEN')}
          title={`Total misé: ${getBetAmount('EVEN', 'EVEN')} jetons`}
        >
          EVEN
          {getBetAmount('EVEN', 'EVEN') > 0 && (
            <div className="bet-indicator">
              <span className="bet-amount">{getBetAmount('EVEN', 'EVEN')}</span>
            </div>
          )}
        </div>
        <div 
          className="bet-cell simple-chance red-diamond" 
          onClick={() => handlePlaceBet('RED', 'RED')}
          title={`Total misé: ${getBetAmount('RED', 'RED')} jetons`}
        >
          ♦
          {getBetAmount('RED', 'RED') > 0 && (
            <div className="bet-indicator">
              <span className="bet-amount">{getBetAmount('RED', 'RED')}</span>
            </div>
          )}
        </div>
        <div 
          className="bet-cell simple-chance black-diamond" 
          onClick={() => handlePlaceBet('BLACK', 'BLACK')}
          title={`Total misé: ${getBetAmount('BLACK', 'BLACK')} jetons`}
        >
          ♠
          {getBetAmount('BLACK', 'BLACK') > 0 && (
            <div className="bet-indicator">
              <span className="bet-amount">{getBetAmount('BLACK', 'BLACK')}</span>
            </div>
          )}
        </div>
        <div 
          className="bet-cell simple-chance" 
          onClick={() => handlePlaceBet('ODD', 'ODD')}
          title={`Total misé: ${getBetAmount('ODD', 'ODD')} jetons`}
        >
          ODD
          {getBetAmount('ODD', 'ODD') > 0 && (
            <div className="bet-indicator">
              <span className="bet-amount">{getBetAmount('ODD', 'ODD')}</span>
            </div>
          )}
        </div>
        <div 
          className="bet-cell simple-chance" 
          onClick={() => handlePlaceBet('HIGH', 'HIGH')}
          title={`Total misé: ${getBetAmount('HIGH', 'HIGH')} jetons`}
        >
          19-36
          {getBetAmount('HIGH', 'HIGH') > 0 && (
            <div className="bet-indicator">
              <span className="bet-amount">{getBetAmount('HIGH', 'HIGH')}</span>
            </div>
          )}
        </div>
      </div>
    );

    return <div className="roulette-table">{tableLayout}</div>;
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-right">
          <button 
            className="achievements-btn"
            onClick={() => setShowAchievementsModal(true)}
          >
            🏆 Achievements
          </button>
          <button 
            className="history-btn"
            onClick={() => setShowHistoryModal(true)}
          >
            📊 Historique
          </button>
          
          {/* Nouveau bouton de solde avec menu déroulant */}
          <div className="balance-menu-container">
            <button 
              className="balance-btn"
              onClick={handleBalanceClick}
            >
              <span className="balance-amount">{balance} 🪙</span>
            </button>
            
            {/* Bouton "Regarder une pub" qui apparaît en dessous */}
            {showAdButton && (
              <button 
                className="ad-btn dropdown"
                onClick={handleWatchAd}
                disabled={!canWatchAd}
              >
                📺 Regarder une pub (50 🪙)
              </button>
            )}
          </div>

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
          
          {/* Message d'information déplacé ici sous la roulette */}
          {message && (
            <div className="message-box">
              {message}
            </div>
          )}
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
              {/* NOUVEAUX BOUTONS DE POURCENTAGE - VERSION CORRIGÉE */}
              <button
                className="amount-btn percentage-btn"
                onClick={() => {
                  const tenPercent = Math.max(1, Math.floor(balance * 0.1));
                  setSelectedAmount(tenPercent);
                }}
                disabled={balance === 0 || isSpinning}
              >
                10%
              </button>
              <button
                className="amount-btn percentage-btn"
                onClick={() => {
                  const twentyFivePercent = Math.max(1, Math.floor(balance * 0.25));
                  setSelectedAmount(twentyFivePercent);
                }}
                disabled={balance === 0 || isSpinning}
              >
                25%
              </button>
              <button
                className="amount-btn percentage-btn"
                onClick={() => {
                  const fiftyPercent = Math.max(1, Math.floor(balance * 0.5));
                  setSelectedAmount(fiftyPercent);
                }}
                disabled={balance === 0 || isSpinning}
              >
                50%
              </button>
              <button
                className="amount-btn percentage-btn all-in-btn"
                onClick={() => setSelectedAmount(Math.max(1, balance))}
                disabled={balance === 0 || isSpinning}
              >
                All in
              </button>
            </div>
          </div>

          {renderBettingTable(activeBets)}

          {/* Affichage des paris actifs */}
          {activeBets.length > 0 && (
            <div className="bets-summary">
              <p>Total: {bettingManager.getTotalBetAmount()} 🪙</p>
              <button 
                className="clear-bets-btn"
                onClick={handleClearBets}
                disabled={isSpinning}
              >
                Effacer tous
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal des Achievements */}
      <AchievementsModal 
        showAchievementsModal={showAchievementsModal}
        setShowAchievementsModal={setShowAchievementsModal}
        allAchievements={allAchievements}
      />

      {/* Modal Historique */}
      <HistoryModal 
        showHistoryModal={showHistoryModal}
        setShowHistoryModal={setShowHistoryModal}
        gameHistory={gameHistory}
        setGameHistory={setGameHistory}
      />
    </div>
  );
}

export default App;