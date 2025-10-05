
import React from 'react';
import './QuestsModal.css';

const QuestsModal = ({ showQuestsModal, setShowQuestsModal, dailyQuests, weeklyQuests, dailyQuestSystem, weeklyQuestSystem, xpSystem, setPlayerXp, setPlayerLevel, setXpForNextLevel, wallet, setBalance, setMessage }) => {
  if (!showQuestsModal) {
    return null;
  }

  const handleClaimDailyReward = (questId) => {
    const reward = dailyQuestSystem.claimReward(questId);
    if (reward) {
      xpSystem.addXp(reward.xp);
      setPlayerXp(xpSystem.getXp());
      setPlayerLevel(xpSystem.getLevel());
      setXpForNextLevel(xpSystem.getXpForNextLevel(xpSystem.getLevel()));
      if (reward.tokens > 0) {
        wallet.addBalance(reward.tokens);
        setBalance(wallet.getBalance());
      }
      setMessage(`🎉 Récompense de quête quotidienne : +${reward.xp} XP${reward.tokens > 0 ? ` et ${reward.tokens} jetons` : ''} !`);
      // Recharger les quêtes pour mettre à jour l'affichage
      setShowQuestsModal(false); // Fermer et rouvrir pour forcer le re-render
      setTimeout(() => setShowQuestsModal(true), 10);
    } else {
      setMessage("Impossible de réclamer la récompense.");
    }
  };

  const handleClaimWeeklyReward = (questId) => {
    const reward = weeklyQuestSystem.claimReward(questId);
    if (reward) {
      xpSystem.addXp(reward.xp);
      setPlayerXp(xpSystem.getXp());
      setPlayerLevel(xpSystem.getLevel());
      setXpForNextLevel(xpSystem.getXpForNextLevel(xpSystem.getLevel()));
      if (reward.credits > 0) {
        wallet.addBalance(reward.credits);
        setBalance(wallet.getBalance());
      }
      setMessage(`🎉 Récompense de quête hebdomadaire : +${reward.xp} XP${reward.credits > 0 ? ` et ${reward.credits} crédits` : ''} !`);
      // Recharger les quêtes pour mettre à jour l'affichage
      setShowQuestsModal(false); // Fermer et rouvrir pour forcer le re-render
      setTimeout(() => setShowQuestsModal(true), 10);
    } else {
      setMessage("Impossible de réclamer la récompense.");
    }
  };

  return (
    <div className="quests-modal-overlay">
      <div className="quests-modal-content">
        <button className="close-button" onClick={() => setShowQuestsModal(false)}>×</button>
        <h2>Quêtes</h2>

        <div className="quests-section">
          <h3>Quêtes Quotidiennes</h3>
          {dailyQuests.length === 0 ? (
            <p>Aucune quête quotidienne disponible pour le moment.</p>
          ) : (
            <div className="quests-list">
              {dailyQuests.map(quest => (
                <div key={quest.id} className={`quest-item ${quest.completed ? 'completed' : ''} ${quest.claimed ? 'claimed' : ''}`}>
                  <div className="quest-info">
                    <h4>{quest.description}</h4>
                    <p>Type: {quest.type}</p>
                    <p>Progression: {quest.currentProgress} / {quest.target}</p>
                    <p>Récompense: {quest.rewardXp} XP {quest.rewardTokens > 0 && `+ ${quest.rewardTokens} jetons`}</p>
                  </div>
                  <button 
                    className="claim-button"
                    onClick={() => handleClaimDailyReward(quest.id)}
                    disabled={!quest.completed || quest.claimed}
                  >
                    {quest.claimed ? 'Réclamée' : (quest.completed ? 'Réclamer' : 'En cours')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="quests-section">
          <h3>Quêtes Hebdomadaires</h3>
          {weeklyQuests.length === 0 ? (
            <p>Aucune quête hebdomadaire disponible pour le moment.</p>
          ) : (
            <div className="quests-list">
              {weeklyQuests.map(quest => (
                <div key={quest.id} className={`quest-item ${quest.completed ? 'completed' : ''} ${quest.claimed ? 'claimed' : ''}`}>
                  <div className="quest-info">
                    <h4>{quest.description}</h4>
                    <p>Type: {quest.type}</p>
                    <p>Progression: {quest.currentProgress} / {quest.target}</p>
                    <p>Récompense: {quest.rewardXp} XP {quest.rewardCredits > 0 && `+ ${quest.rewardCredits} crédits`}</p>
                  </div>
                  <button 
                    className="claim-button"
                    onClick={() => handleClaimWeeklyReward(quest.id)}
                    disabled={!quest.completed || quest.claimed}
                  >
                    {quest.claimed ? 'Réclamée' : (quest.completed ? 'Réclamer' : 'En cours')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestsModal;

