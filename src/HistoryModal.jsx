
import React from 'react';

const HistoryModal = React.memo(({ showHistoryModal, setShowHistoryModal, gameHistory, setGameHistory }) => {
  if (!showHistoryModal) return null;

  const totalProfit = gameHistory.reduce((sum, game) => sum + game.netProfit, 0);
  const totalGames = gameHistory.length;
  const wins = gameHistory.filter(game => game.netProfit > 0).length;
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;

  return (
    <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📊 Historique des Parties</h3>
          <button 
            className="modal-close"
            onClick={() => setShowHistoryModal(false)}
          >
            ✕
          </button>
        </div>
        
        {/* Statistiques résumées */}
        <div className="history-stats" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '10px'
        }}>
          <div className="stat-item">
            <div style={{ fontSize: '0.8rem', color: '#ffd700' }}>Total Parties</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalGames}</div>
          </div>
          <div className="stat-item">
            <div style={{ fontSize: '0.8rem', color: '#ffd700' }}>Taux de Victoire</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{winRate}%</div>
          </div>
          <div className="stat-item">
            <div style={{ fontSize: '0.8rem', color: '#ffd700' }}>Profit/Perte Total</div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              color: totalProfit >= 0 ? '#28a745' : '#dc143c'
            }}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit} 🪙
            </div>
          </div>
          <div className="stat-item">
            <div style={{ fontSize: '0.8rem', color: '#ffd700' }}>Victoires</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>{wins}</div>
          </div>
        </div>

        {/* Liste des parties */}
        <div className="history-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {gameHistory.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              color: '#888',
              fontStyle: 'italic'
            }}>
              Aucune partie enregistrée
            </div>
          ) : (
            gameHistory.map((game) => (
              <div 
                key={game.id}
                className="history-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${
                    game.netProfit > 0 ? '#28a745' : 
                    game.netProfit < 0 ? '#dc143c' : '#ffd700'
                  }`
                }}
              >
                <div className="history-info">
                  <div style={{ fontWeight: 'bold' }}>
                    Numéro: <span style={{ color: game.color === 'red' ? '#dc143c' : game.color === 'black' ? '#333' : '#28a745' }}>{game.number}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
                    {game.timestamp}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
                    Mise totale: {game.totalBet} 🪙
                  </div>
                </div>
                <div className="history-profit" style={{ textAlign: 'right' }}>
                  <div style={{
                      fontWeight: 'bold',
                      color: game.netProfit > 0 ? '#28a745' :
                             game.netProfit < 0 ? '#dc143c' : '#ffd700'
                  }}>
                    {game.netProfit > 0 ? '+' : ''}{game.netProfit} 🪙
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                    Gains: {game.winnings} 🪙
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bouton pour effacer l'historique */}
        {gameHistory.length > 0 && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              className="clear-bets-btn"
              onClick={() => {
                setGameHistory([]);
                localStorage.removeItem('gameHistory');
              }}
              style={{
                background: 'rgba(220, 20, 60, 0.3)',
                border: '1px solid #dc143c',
                color: '#ffffff',
                padding: '0.5rem 1rem',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              🗑️ Effacer l'historique
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default HistoryModal;

