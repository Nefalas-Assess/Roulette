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

  // États du jeu
  const [balance, setBalance] = useState(wallet.getBalance());
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [winningNumber, setWinningNumber] = useState(null);
  
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

  // Vérification des timers pour les récompenses
  const checkTimers = () => {
    const now = Date.now();
    const lastHourlyClaim = parseInt(localStorage.getItem('lastHourlyClaim') || '0');
    const lastAdWatch = parseInt(localStorage.getItem('lastAdWatch') || '0');
    
    setCanClaimHourly(now - lastHourlyClaim > 3600000); // 1 heure
    setCanWatchAd(now - lastAdWatch > 300000); // 5 minutes
  };

  // Fonction pour ajouter un pari
  const handlePlaceBet = (betType, betValue) => {
    if (isSpinning) return;

    // Validation du solde
    const validation = wallet.validateTransaction(selectedAmount);
    if (!validation.valid) {
      setMessage(`❌ ${validation.reason}`);
      return;
    }

    try {
      bettingManager.addBet(betType, betValue, selectedAmount);
      
      // Déduction du solde
      wallet.deductBalance(selectedAmount);
      setBalance(wallet.getBalance());
      
      // Mise à jour de l'affichage
      setActiveBets(bettingManager.getBets());
      setMessage(`✅ Pari ajouté : ${formatBetDisplay(betType, betValue)} (${selectedAmount} jetons)`);
      
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
  };

  // Fonction principale de spin
  const handleSpin = () => {
    if (isSpinning) return;

    const bets = bettingManager.getBets();
    if (bets.length === 0) {
      setMessage('❌ Placez au moins un pari avant de lancer');
      return;
    }

    setIsSpinning(true);
    setMessage('🎰 La roue tourne...');

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
      setBalance(wallet.getBalance());

      // Statistiques pour les succès
      achievementSystem.recordSpin(spinResult.number, netProfit);
      const unlockedAchievements = achievementSystem.checkAchievements();
      if (unlockedAchievements.length > 0) {
        setAchievements(prev => [...prev, ...unlockedAchievements]);
      }

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

      // Nettoyage des paris
      bettingManager.clearBets();
      setActiveBets([]);
      setIsSpinning(false);
    }, 3000);
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

  const renderBettingTable = () => {
    const tableLayout = [];

    // Row for 0 and 00
    tableLayout.push(
      <div key="zero-row" className="roulette-row zero-row">
        <div className="bet-cell zero" onClick={() => handlePlaceBet('STRAIGHT_UP', 0)}>0</div>
        <div className="bet-cell double-zero" onClick={() => handlePlaceBet('STRAIGHT_UP', '00')}>00</div>
      </div>
    );

    // Main numbers 1-36 (arranged in 3 columns, 12 rows)
    for (let row = 0; row < 12; row++) {
      const rowNumbers = [];
      for (let col = 0; col < 3; col++) {
        const num = (row * 3) + col + 1;
        if (num <= 36) {
          const isRed = RED_NUMBERS.includes(num);
          const isBlack = BLACK_NUMBERS.includes(num);
          rowNumbers.push(
            <div 
              key={num}
              className={`bet-cell number ${isRed ? 'red' : ''} ${isBlack ? 'black' : ''}`}
              onClick={() => handlePlaceBet('STRAIGHT_UP', num)}
            >
              {num}
            </div>
          );
        }
      }
      tableLayout.push(<div key={`number-row-${row}`} className="roulette-row">{rowNumbers}</div>);
    }

    // Outside bets (1st 12, 2nd 12, 3rd 12)
    tableLayout.push(
      <div key="dozen-row" className="roulette-row dozen-row">
        <div className="bet-cell dozen" onClick={() => handlePlaceBet('DOZEN', 'FIRST_DOZEN')}>1st 12</div>
        <div className="bet-cell dozen" onClick={() => handlePlaceBet('DOZEN', 'SECOND_DOZEN')}>2nd 12</div>
        <div className="bet-cell dozen" onClick={() => handlePlaceBet('DOZEN', 'THIRD_DOZEN')}>3rd 12</div>
      </div>
    );

    // Simple chances (1-18, Even, Red, Black, Odd, 19-36)
    tableLayout.push(
      <div key="simple-chance-row" className="roulette-row simple-chance-row">
        <div className="bet-cell simple-chance" onClick={() => handlePlaceBet('LOW', 'LOW')}>1-18</div>
        <div className="bet-cell simple-chance" onClick={() => handlePlaceBet('EVEN', 'EVEN')}>EVEN</div>
        <div className="bet-cell simple-chance red-diamond" onClick={() => handlePlaceBet('RED', 'RED')}>♦</div>
        <div className="bet-cell simple-chance black-diamond" onClick={() => handlePlaceBet('BLACK', 'BLACK')}>♠</div>
        <div className="bet-cell simple-chance" onClick={() => handlePlaceBet('ODD', 'ODD')}>ODD</div>
        <div className="bet-cell simple-chance" onClick={() => handlePlaceBet('HIGH', 'HIGH')}>19-36</div>
      </div>
    );

    return <div className="roulette-table">{tableLayout}</div>;
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎰 Roulette Américaine</h1>
        <div className="header-right">
          <div className="balance-display">
            <span className="balance-label">Solde:</span>
            <span className="balance-amount">{balance} 🪙</span>
          </div>
          <button 
            className="reward-btn ad-btn"
            onClick={handleWatchAd}
            disabled={!canWatchAd}
          >
            📺 Regarder une pub (50 🪙)
          </button>
        </div>
      </header>

      <main className="app-main">
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
          <h2>Placer vos paris</h2>
          
          {/* Sélection du montant */}
          <div className="amount-selector">
            <label>Montant du pari:</label>
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
            </div>
          </div>

          {/* Table de paris cliquable */}
          {renderBettingTable()}

          {/* Paris actifs */}
          {activeBets.length > 0 && (
            <div className="active-bets">
              <h3>Paris actifs ({activeBets.length})</h3>
              <div className="bets-list">
                {activeBets.map((bet) => (
                  <div key={bet.id} className="bet-item">
                    <span className="bet-info">
                      {formatBetDisplay(bet.type, bet.value)} - {bet.amount} 🪙
                    </span>
                    <button
                      className="remove-bet-btn"
                      onClick={() => handleRemoveBet(bet.id)}
                      disabled={isSpinning}
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
              <div className="bets-summary">
                <p>Total misé: <strong>{bettingManager.getTotalBetAmount()} 🪙</strong></p>
                <button 
                  className="clear-bets-btn"
                  onClick={handleClearBets}
                  disabled={isSpinning}
                >
                  🗑️ Effacer tous
                </button>
              </div>
            </div>
          )}

          {/* Bouton de lancement */}
          <button 
            className="spin-btn"
            onClick={handleSpin}
            disabled={isSpinning || activeBets.length === 0}
          >
            {isSpinning ? '🎰 La roue tourne...' : '🎯 Lancer la roue'}
          </button>

          {/* Message de feedback */}
          {message && (
            <div className="message-box">
              {message}
            </div>
          )}
        </div>

        {/* Résultat du dernier tour */}
        {lastResult && (
          <div className="last-result">
            <h3>Dernier résultat</h3>
            <div className={`result-number ${lastResult.color}`}>
              {lastResult.number}
            </div>
            <p>Couleur: {lastResult.color === 'red' ? '🔴 Rouge' : lastResult.color === 'black' ? '⚫ Noir' : '🟢 Vert'}</p>
            <p>Gains: {lastResult.winnings} 🪙</p>
            <p className={lastResult.netProfit >= 0 ? 'profit' : 'loss'}>
              {lastResult.netProfit >= 0 ? '📈' : '📉'} 
              {' '}Résultat net: {lastResult.netProfit} 🪙
            </p>
          </div>
        )}

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
