import React, { useState } from 'react'
import RouletteWheel from './RouletteWheel.jsx'
import { spinRoulette, calculatePayout } from './rouletteLogic.js'
import './RouletteWheel.css'

function App() {
  const [balance, setBalance] = useState(1000) // solde de départ
  const [bet, setBet] = useState('')
  const [amount, setAmount] = useState(100)
  const [result, setResult] = useState(null)

  const handleSpin = () => {
    if (!bet) {
      alert('Veuillez choisir une mise avant de jouer.')
      return
    }

    const outcome = spinRoulette()
    setResult(outcome)

    const payout = calculatePayout(bet, amount, outcome)
    setBalance(prev => prev + payout)
  }

  return (
    <div className="app-container">
      <h1>🎰 American Roulette</h1>

      <div className="wallet">
        <p>💰 Solde : {balance} $</p>
      </div>

      <div className="betting">
        <input
          type="text"
          placeholder="Miser sur (ex: red, black, 7)"
          value={bet}
          onChange={(e) => setBet(e.target.value)}
        />
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <button onClick={handleSpin}>Lancer la roue</button>
      </div>

      <RouletteWheel result={result} />

      {result && (
        <div className="result">
          <p>Résultat : {result.number} ({result.color})</p>
        </div>
      )}
    </div>
  )
}

export default App
