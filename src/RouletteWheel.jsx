import { useState, useEffect, useRef } from 'react';
import './RouletteWheel.css';

const RouletteWheel = ({ isSpinning, result, winningNumber }) => {
  const [rotation, setRotation] = useState(0);
  const [displayNumber, setDisplayNumber] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);

  const wheelNumbers = [
    0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1,
    '00', 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2
  ];

  const getNumberColor = (num) => {
    if (num === 0 || num === '00') return 'green';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num) ? 'red' : 'black';
  };

  // Fonction pour calculer l'angle cible avec précision
  const calculateTargetRotation = (targetNumber) => {
    const targetIndex = wheelNumbers.indexOf(targetNumber);
    if (targetIndex === -1) {
      console.error('Numéro cible non trouvé:', targetNumber);
      return 0;
    }
    
    const degreesPerNumber = 360 / wheelNumbers.length;
    // Position cible (en degrés)
    const targetPosition = targetIndex * degreesPerNumber;
    
    // Au moins 2 tours complets + position cible ajustée
    const minRotations = 2; // Minimum de tours complets
    const extraRotations = minRotations * 360;
    
    // Ajustement pour que le numéro s'aligne avec l'indicateur
    // L'indicateur est en haut, donc on soustrait la position cible
    const finalRotation = extraRotations + (360 - targetPosition);
    
    console.log(`Target: ${targetNumber}, Index: ${targetIndex}, Final rotation: ${finalRotation}°`);
    return finalRotation;
  };

  // Effet pour l'animation du spin - MODIFIÉ
  useEffect(() => {
    if (result && !isAnimating) {
      console.log('🚀 Démarrage de l\'animation pour le numéro:', result.number);
      
      // Réinitialiser l'affichage
      setDisplayNumber(null);
      setIsAnimating(true);
      
      // Calculer la rotation cible
      const targetRotation = calculateTargetRotation(result.number);
      
      // Démarrer l'animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Commencer à 0 et animer vers la cible
      setRotation(0);
      
      // Petit délai pour s'assurer que le DOM est mis à jour
      setTimeout(() => {
        setRotation(targetRotation);
      }, 50);
      
      // Afficher le résultat après l'animation
      const animationDuration = 10000; // 5 secondes pour l'animation
      setTimeout(() => {
        setDisplayNumber(result.number);
        setIsAnimating(false);
        console.log('✅ Animation terminée');
      }, animationDuration);
    }
  }, [result]); // Supprimer isSpinning des dépendances

  // Nettoyer l'animation lors du démontage
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="roulette-wheel-container">
      <div className="wheel-wrapper">
        <div className="wheel-indicator">▼</div>
        
        <div 
          className={`wheel ${isAnimating ? 'spinning' : ''}`}
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transition: isAnimating 
              ? 'transform 5s cubic-bezier(0.2, 0.8, 0.3, 1)'  // Courbe d'accélération/décélération plus fluide
              : 'none'
          }}
        >
          <div className="wheel-center">
            <div className="wheel-logo">🎰</div>
          </div>
          
          {wheelNumbers.map((num, index) => {
            const angle = (360 / wheelNumbers.length) * index;
            const color = getNumberColor(num);
            
            return (
              <div
                key={index}
                className={`wheel-segment ${color}`}
                style={{
                  transform: `rotate(${angle}deg) translateY(-80px)`
                }}
              >
                <span className="wheel-number">{num}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default RouletteWheel;