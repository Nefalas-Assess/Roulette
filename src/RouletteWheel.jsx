import React, { useState, useEffect, useRef } from 'react';
import './RouletteWheel.css';

// American roulette wheel layout (clockwise from 0)
const WHEEL_NUMBERS = [
  0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, '00',
  27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2
];

// Colors for each number
const getNumberColor = (number) => {
  if (number === 0 || number === '00') return 'green';
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return redNumbers.includes(number) ? 'red' : 'black';
};

const RouletteWheel = ({ 
  isSpinning, 
  winningNumber, 
  onSpinComplete,
  size = 300 
}) => {
  const [rotation, setRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [animationPhase, setAnimationPhase] = useState('idle'); // idle, spinning, slowing, stopped
  const wheelRef = useRef(null);
  const ballRef = useRef(null);

  // Calculate the angle for a specific number on the wheel
  const getNumberAngle = (number) => {
    const index = WHEEL_NUMBERS.indexOf(number);
    return (index * (360 / WHEEL_NUMBERS.length)) + (360 / WHEEL_NUMBERS.length / 2);
  };

  useEffect(() => {
    if (isSpinning && winningNumber !== null) {
      startSpinAnimation();
    }
  }, [isSpinning, winningNumber]);

  const startSpinAnimation = () => {
    setAnimationPhase('spinning');
    
    // Calculate target angle for winning number
    const targetAngle = getNumberAngle(winningNumber);
    
    // Add multiple full rotations for dramatic effect
    const fullRotations = 5 + Math.random() * 3; // 5-8 full rotations
    const finalWheelRotation = (fullRotations * 360) + (360 - targetAngle);
    
    // Ball rotates in opposite direction and more rotations
    const ballRotations = 8 + Math.random() * 4; // 8-12 rotations
    const finalBallRotation = (ballRotations * 360) + targetAngle;

    // Phase 1: Fast spinning (1.5 seconds)
    setTimeout(() => {
      setRotation(prev => prev + (fullRotations * 360 * 0.6));
      setBallRotation(prev => prev - (ballRotations * 360 * 0.6));
    }, 100);

    // Phase 2: Slowing down (1 second)
    setTimeout(() => {
      setAnimationPhase('slowing');
      setRotation(prev => prev + (fullRotations * 360 * 0.3));
      setBallRotation(prev => prev - (ballRotations * 360 * 0.3));
    }, 1600);

    // Phase 3: Final positioning (0.5 seconds)
    setTimeout(() => {
      setAnimationPhase('stopped');
      setRotation(finalWheelRotation);
      setBallRotation(finalBallRotation);
    }, 2600);

    // Complete animation
    setTimeout(() => {
      setAnimationPhase('idle');
      if (onSpinComplete) {
        onSpinComplete();
      }
    }, 3100);
  };

  const getTransitionStyle = () => {
    switch (animationPhase) {
      case 'spinning':
        return 'transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      case 'slowing':
        return 'transform 1s cubic-bezier(0.55, 0.085, 0.68, 0.53)';
      case 'stopped':
        return 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
      default:
        return 'none';
    }
  };

  const getBallTransitionStyle = () => {
    switch (animationPhase) {
      case 'spinning':
        return 'transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      case 'slowing':
        return 'transform 1s cubic-bezier(0.55, 0.085, 0.68, 0.53)';
      case 'stopped':
        return 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
      default:
        return 'none';
    }
  };

  return (
    <div className="roulette-container" style={{ width: size, height: size }}>
      {/* Outer rim */}
      <div className="roulette-rim">
        {/* Wheel with numbers */}
        <div 
          ref={wheelRef}
          className="roulette-wheel"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: getTransitionStyle()
          }}
        >
          {WHEEL_NUMBERS.map((number, index) => {
            const angle = (index * (360 / WHEEL_NUMBERS.length));
            const color = getNumberColor(number);
            
            return (
              <div
                key={`${number}-${index}`}
                className={`wheel-number ${color}`}
                style={{
                  transform: `rotate(${angle}deg) translateY(-${size * 0.35}px)`,
                  transformOrigin: '50% 100%'
                }}
              >
                <span 
                  className="number-text"
                  style={{
                    transform: `rotate(${-angle}deg)`,
                    fontSize: `${size * 0.04}px`
                  }}
                >
                  {number}
                </span>
              </div>
            );
          })}
        </div>

        {/* Ball track */}
        <div className="ball-track">
          <div 
            ref={ballRef}
            className="roulette-ball"
            style={{
              transform: `rotate(${ballRotation}deg) translateX(${size * 0.38}px)`,
              transition: getBallTransitionStyle()
            }}
          >
            <div className="ball"></div>
          </div>
        </div>

        {/* Center hub */}
        <div className="wheel-center">
          <div className="center-logo">
            {animationPhase === 'idle' && winningNumber !== null ? (
              <span className="winning-number">{winningNumber}</span>
            ) : (
              <span className="question-mark">?</span>
            )}
          </div>
        </div>

        {/* Pointer */}
        <div className="wheel-pointer"></div>
      </div>
    </div>
  );
};

export default RouletteWheel;

