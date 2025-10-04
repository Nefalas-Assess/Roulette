
import React from 'react';

const AchievementsModal = React.memo(({ showAchievementsModal, setShowAchievementsModal, allAchievements }) => {
  if (!showAchievementsModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowAchievementsModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🏆 Achievements</h3>
          <button 
            className="modal-close"
            onClick={() => setShowAchievementsModal(false)}
          >
            ✕
          </button>
        </div>
        <div className="achievements-list">
          {allAchievements.map((achievement) => (
            <div 
              key={achievement.id} 
              className={`achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon">
                {achievement.unlocked ? achievement.icon : '🔒'}
              </div>
              <div className="achievement-info">
                <h4>{achievement.name}</h4>
                <p>{achievement.description}</p>
                <span className="achievement-category">{achievement.category}</span>
              </div>
              <div className="achievement-status">
                {achievement.unlocked ? '✅ Débloqué' : '🔒 Verrouillé'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default AchievementsModal;

