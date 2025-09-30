import { useState, useEffect } from 'react';
import RouletteWheel from './RouletteWheel';
import { spinWheel } from './rouletteLogic';
import { WalletSystem } from './walletSystem';
import { BettingManager, BET_TYPES, BET_AMOUNTS } from './bettingSystem';
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
  const [selectedAmount, setSelectedAmount] = useState(BET_AMOUNTS.MIN);
  const [selectedBetType, setSelectedBetType] = useState('');
  const [selectedNumber, setSelectedNumber] = useState('');
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
  const handleAddBet = () => {
    // Validation du type de pari
    if (!selectedBetType) {
      setMessage('❌ Veuillez sélectionner un type de pari');
      return;
    }

    // Validation du numéro pour les paris STRAIGHT_UP
    if (selectedBetType === 'STRAIGHT_UP') {
      const num = parseInt(selectedNumber);
      if (isNaN(num) || num < 0 || num > 36) {
        setMessage('❌ Numéro invalide (0-36)');
        return;
      }
    }

    // Validation du solde
    const validation = wallet.validateTransaction(selectedAmount);
    if (!validation.valid) {
      setMessage(`❌ ${validation.reason}`);
      return;
    }

    // Ajout du pari
    try {
      const betValue = selectedBetType === 'STRAIGHT_UP' 
        ? parseInt(selectedNumber) 
        : selectedBetType;
      
      bettingManager.addBet(selectedBetType, betValue, selectedAmount);
      
      // Déduction du solde
      wallet.deductBalance(selectedAmount);
      setBalance(wallet.getBalance());
      
      // Mise à jour de l'affichage
      setActiveBets(bettingManager.getBets());
      setMessage(`✅ Pari ajouté : ${formatBetType(selectedBetType)} (${selectedAmount} jetons)`);
      
      // Réinitialisation de la sélection
      setSelectedNumber('');
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    }
  };

  // Fonction pour retirer un pari
  const handleRemoveBet = (index) => {
    const bet = bettingManager.getBets()[index];
    if (bet) {
      bettingManager.removeBet(index);
      wallet.addBalance(bet.amount);
      setBalance(wallet.getBalance());
      setActiveBets(bettingManager.getBets());
      setMessage(`🔄 Pari retiré : ${bet.amount} jetons remboursés`);
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

  // Récompense horaire
  const handleHourlyClaim = () => {
    if (!canClaimHourly) {
      setMessage('⏰ Récompense déjà réclamée. Revenez dans 1 heure.');
      return;
    }

    const reward = wallet.claimHourlyReward();
    setBalance(wallet.getBalance());
    setCanClaimHourly(false);
    localStorage.setItem('lastHourlyClaim', Date.now().toString());
    setMessage(`🎁 Vous avez reçu ${reward} jetons !`);

    setTimeout(() => setCanClaimHourly(true), 3600000);
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
  const formatBetType = (type) => {
    const labels = {
      'RED': 'Rouge',
      'BLACK': 'Noir',
      'EVEN': 'Pair',
      'ODD': 'Impair',
      'LOW': '1-18',
      'HIGH': '19-36',
      'STRAIGHT_UP': `N° ${selectedNumber}`
    };
    return labels[type] || type;
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎰 Roulette Américaine</h1>
        <div className="balance-display">
          <span className="balance-label">Solde:</span>
          <span className="balance-amount">{balance} 🪙</span>
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
              {[10, 25, 50, 100, 250, 500].map(amount => (
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

          {/* Sélection du type de pari */}
          <div className="bet-type-selector">
            <label>Type de pari:</label>
            <div className="bet-type-grid">
              <button
                className={`bet-type-btn red ${selectedBetType === 'RED' ? 'selected' : ''}`}
                onClick={() => setSelectedBetType('RED')}
              >
                Rouge
              </button>
              <button
                className={`bet-type-btn black ${selectedBetType === 'BLACK' ? 'selected' : ''}`}
                onClick={() => setSelectedBetType('BLACK')}
              >
                Noir
              </button>
              <button
                className={`bet-type-btn ${selectedBetType === 'EVEN' ? 'selected' : ''}`}
                onClick={() => setSelectedBetType('EVEN')}
              >
                Pair
              </button>
              <button
                className={`bet-type-btn ${selectedBetType === 'ODD' ? 'selected' : ''}`}
                onClick={() => setSelectedBetType('ODD')}
              >
                Impair
              </button>
              <button
                className={`bet-type-btn ${selectedBetType === 'LOW' ? 'selected' : ''}`}
                onClick={() => setSelectedBetType('LOW')}
              >
                1-18
              </button>
              <button
                className={`bet-type-btn ${selectedBetType === 'HIGH' ? 'selected' : ''}`}
                onClick={() => setSelectedBetType('HIGH')}
              >
                19-36
              </button>
            </div>
            
            {/* Pari sur numéro unique */}
            <div className="straight-up-bet">
              <button
                className={`bet-type-btn ${selectedBetType === 'STRAIGHT_UP' ? 'selected' : ''}`}
                onClick={() => setSelectedBetType('STRAIGHT_UP')}
              >
                Numéro Unique
              </button>
              {selectedBetType === 'STRAIGHT_UP' && (
                <input
                  type="number"
                  min="0"
                  max="36"
                  placeholder="0-36"
                  value={selectedNumber}
                  onChange={(e) => setSelectedNumber(e.target.value)}
                  className="number-input"
                />
              )}
            </div>
          </div>

          <button 
            className="add-bet-btn"
            onClick={handleAddBet}
            disabled={isSpinning}
          >
            ➕ Ajouter le pari
          </button>

          {/* Paris actifs */}
          {activeBets.length > 0 && (
            <div className="active-bets">
              <h3>Paris actifs ({activeBets.length})</h3>
              <div className="bets-list">
                {activeBets.map((bet, index) => (
                  <div key={index} className="bet-item">
                    <span className="bet-info">
                      {bet.type === BET_TYPES.STRAIGHT_UP 
                        ? `N° ${bet.value}` 
                        : formatBetType(bet.type)
                      } - {bet.amount} 🪙
                    </span>
                    <button
                      className="remove-bet-btn"
                      onClick={() => handleRemoveBet(index)}
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

        {/* Récompenses */}
        <div className="rewards-section">
          <h3>Récompenses gratuites</h3>
          <button 
            className="reward-btn"
            onClick={handleHourlyClaim}
            disabled={!canClaimHourly}
          >
            🎁 Récompense horaire (100 🪙)
          </button>
          <button 
            className="reward-btn"
            onClick={handleWatchAd}
            disabled={!canWatchAd}
          >
            📺 Regarder une pub (50 🪙)
          </button>
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