import { useState, useEffect } from 'react';
import './RouletteWheel.css';

const RouletteWheel = ({ isSpinning, result, winningNumber }) => {
  const [rotation, setRotation] = useState(0);
  const [displayNumber, setDisplayNumber] = useState(null);

  // Numéros de la roulette américaine dans l'ordre de la roue
  const wheelNumbers = [
    0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1,
    '00', 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2
  ];

  // Couleurs pour chaque numéro
  const getNumberColor = (num) => {
    if (num === 0 || num === '00') return 'green';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num) ? 'red' : 'black';
  };

  // Effet pour l'animation du spin
  useEffect(() => {
    if (isSpinning && result) {
      // Calculer l'angle cible basé sur le numéro gagnant
      const targetIndex = wheelNumbers.indexOf(result.number);
      const degreesPerNumber = 360 / wheelNumbers.length;
      const targetAngle = targetIndex * degreesPerNumber;
      
      // Ajouter plusieurs rotations complètes pour l'effet
      const extraRotations = 1440; // 4 tours complets
      const finalRotation = extraRotations + (360 - targetAngle);
      
      setRotation(finalRotation);
      setDisplayNumber(null);
      
      // Afficher le numéro gagnant après l'animation
      setTimeout(() => {
        setDisplayNumber(result.number);
      }, 10000);
    }
  }, [isSpinning, result]);

  // Utiliser winningNumber comme fallback si result n'est pas disponible
  const currentNumber = displayNumber !== null ? displayNumber : winningNumber;

  return (
    <div className="roulette-wheel-container">
      <div className="wheel-wrapper">
        {/* Indicateur fixe (flèche pointant vers le haut) */}
        <div className="wheel-indicator">▼</div>
        
        {/* La roue qui tourne */}
        <div 
          className={`wheel ${isSpinning ? 'spinning' : ''}`}
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 10s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
          }}
        >
          {/* Cercle central */}
          <div className="wheel-center">
            <div className="wheel-logo">🎰</div>
          </div>
          
          {/* Segments de la roue */}
          {wheelNumbers.map((num, index) => {
            const angle = (360 / wheelNumbers.length) * index;
            const color = getNumberColor(num);
            
            return (
              <div
                key={index}
                className={`wheel-segment ${color}`}
                style={{
                  transform: `rotate(${angle}deg) translateY(-140px)`
                }}
              >
                <span className="wheel-number">{num}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Affichage du résultat */}
      {currentNumber !== null && !isSpinning && (
        <div className="result-display">
          <div className={`result-bubble ${getNumberColor(currentNumber)}`}>
            <span className="result-label">Résultat</span>
            <span className="result-value">{currentNumber}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouletteWheel;