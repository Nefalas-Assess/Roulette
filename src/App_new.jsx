import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Clock,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { 
  generateWinningNumber, 
  getNumberColor, 
  calculateWinnings, 
  updateHotColdNumbers,
  ROULETTE_NUMBERS 
} from './utils/rouletteLogic';
import {
  calculateClaimableTokens,
  canWatchAd,
  processAdWatch,
  getTimeUntilNextClaim,
  validateTransaction,
  formatTokens,
  WALLET_CONFIG
} from './utils/walletSystem';
import {
  calculateAdvancedStats,
  analyzeNumberPatterns,
  generatePerformanceChart,
  analyzeBettingPatterns
} from './utils/statisticsEngine';
import {
  adSystem,
  initializeAds,
  showRewardedAdWithLoading,
  preloadAds,
  AD_STATES
} from './utils/adSystem';
import {
  BettingManager,
  BET_AMOUNTS,
  BET_TYPES,
  BETTING_AREAS,
  getNumberColor as getBetNumberColor
} from './utils/bettingSystem';
import './App.css';

// Betting table layout
const bettingNumbers = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
];

function App() {
  const [tokens, setTokens] = useState(WALLET_CONFIG.INITIAL_TOKENS);
  const [bettingManager] = useState(() => new BettingManager());
  const [selectedBetAmount, setSelectedBetAmount] = useState(BET_AMOUNTS[0]);
  const [currentBets, setCurrentBets] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [hotNumbers, setHotNumbers] = useState([7, 23, 17, 32, 11]);
  const [coldNumbers, setColdNumbers] = useState([13, 6, 34, 2, 29]);
  const [lastTokenClaim, setLastTokenClaim] = useState(Date.now());
  const [adWatchHistory, setAdWatchHistory] = useState([]);
  const [adSystemReady, setAdSystemReady] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [stats, setStats] = useState({
    totalGames: 0,
    totalWins: 0,
    totalBetAmount: 0,
    totalWinnings: 0
  });

  // Initialize ad system
  useEffect(() => {
    const initAds = async () => {
      try {
        const success = await initializeAds('GOOGLE_ADMOB');
        setAdSystemReady(success);
        
        if (success) {
          await preloadAds();
        }
      } catch (error) {
        console.error('Failed to initialize ad system:', error);
        setAdSystemReady(false);
      }
    };

    initAds();
  }, []);

  // Check for hourly token claim
  useEffect(() => {
    const checkTokenClaim = () => {
      const now = Date.now();
      const hoursPassed = Math.floor((now - lastTokenClaim) / (1000 * 60 * 60));
      
      if (hoursPassed >= 1 && tokens < WALLET_CONFIG.MAX_TOKENS) {
        // Auto-claim available tokens
        const { claimableTokens } = calculateClaimableTokens(lastTokenClaim, tokens);
        if (claimableTokens > 0) {
          setTokens(prev => prev + claimableTokens);
          setLastTokenClaim(now);
        }
      }
    };

    const interval = setInterval(checkTokenClaim, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tokens, lastTokenClaim]);

  const getNumberColorClass = (number) => {
    const color = getBetNumberColor(number);
    if (color === 'green') return 'bg-green-600';
    if (color === 'red') return 'bg-red-600';
    return 'bg-black';
  };

  const placeBet = (betType, numbers, area = null) => {
    const validation = validateTransaction(tokens, selectedBetAmount, 'bet');
    if (!validation.valid) {
      console.log(validation.message);
      return;
    }
    
    setTokens(prev => prev - selectedBetAmount);
    bettingManager.setBetAmount(selectedBetAmount);
    const bet = bettingManager.addBet(betType, numbers, selectedBetAmount, area);
    setCurrentBets(bettingManager.getAllBets());
  };

  const clearBets = () => {
    const totalBetAmount = bettingManager.getTotalBetAmount();
    setTokens(prev => prev + totalBetAmount);
    bettingManager.clearAllBets();
    setCurrentBets([]);
  };

  const spinWheel = () => {
    const totalBetAmount = bettingManager.getTotalBetAmount();
    if (totalBetAmount === 0) return;
    
    setIsSpinning(true);
    
    setTimeout(() => {
      const winning = generateWinningNumber();
      setWinningNumber(winning);
      
      // Calculate winnings using new betting system
      const winningsResult = bettingManager.calculateTotalWinnings(winning);
      const totalWinnings = winningsResult.totalWinnings;
      
      setTokens(prev => prev + totalWinnings);
      
      // Update game history
      const newGameHistory = [{
        id: Date.now(),
        winningNumber: winning,
        bet: totalBetAmount,
        winnings: totalWinnings,
        profit: winningsResult.netProfit,
        betsPlaced: bettingManager.getBetsSummary(),
        timestamp: new Date().toLocaleTimeString()
      }, ...gameHistory.slice(0, 99)];
      
      setGameHistory(newGameHistory);
      
      // Update stats using advanced statistics engine
      const advancedStats = calculateAdvancedStats(newGameHistory, stats);
      setStats(advancedStats);
      
      // Update hot/cold numbers using advanced analysis
      const { hotNumbers: newHot, coldNumbers: newCold } = analyzeNumberPatterns(newGameHistory);
      setHotNumbers(newHot);
      setColdNumbers(newCold);
      
      // Clear bets for next game
      bettingManager.clearAllBets();
      setCurrentBets([]);
      setIsSpinning(false);
    }, 3000);
  };

  const claimHourlyTokens = () => {
    const { claimableTokens, newClaimTime } = calculateClaimableTokens(lastTokenClaim, tokens);
    
    if (claimableTokens > 0) {
      setTokens(prev => prev + claimableTokens);
      setLastTokenClaim(newClaimTime);
    }
  };

  const watchAd = async () => {
    const { canWatch } = canWatchAd(adWatchHistory);
    
    if (!canWatch) {
      console.log('Cannot watch ad');
      return;
    }

    if (!adSystemReady) {
      console.log('Ad system not ready');
      return;
    }

    setIsWatchingAd(true);
    
    try {
      const result = await showRewardedAdWithLoading();
      
      if (result.success) {
        setTokens(prev => prev + result.reward);
        setAdWatchHistory(prev => [...prev, Date.now()]);
        console.log(`Ad completed! Earned ${result.reward} tokens`);
      } else {
        console.log(`Ad failed: ${result.reason}`);
      }
    } catch (error) {
      console.error('Error watching ad:', error);
    } finally {
      setIsWatchingAd(false);
      
      setTimeout(() => {
        preloadAds();
      }, 1000);
    }
  };

  return (
    <div className="casino-background min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-white">American Roulette</h1>
          <div className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold">
            <Coins className="w-5 h-5" />
            {formatTokens(tokens)}
          </div>
        </div>

        <Tabs defaultValue="game" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="game">Game</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
          </TabsList>

          <TabsContent value="game" className="space-y-6">
            {/* Hot and Cold Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-red-500" />
                    Hot Numbers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {hotNumbers.map(num => (
                      <Badge key={num} className="hot-number text-white px-3 py-2">
                        {num}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-blue-500" />
                    Cold Numbers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {coldNumbers.map(num => (
                      <Badge key={num} className="cold-number text-white px-3 py-2">
                        {num}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bet Amount Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Bet Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {BET_AMOUNTS.map(amount => (
                    <Button
                      key={amount}
                      variant={selectedBetAmount === amount ? "default" : "outline"}
                      onClick={() => setSelectedBetAmount(amount)}
                      className="min-w-16"
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={clearBets} variant="destructive" size="sm">
                    Clear All Bets
                  </Button>
                  <div className="text-sm text-muted-foreground flex items-center">
                    Total Bet: {bettingManager.getTotalBetAmount()} tokens
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Roulette Wheel */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Roulette Wheel</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className={`w-48 h-48 rounded-full border-8 border-yellow-500 bg-gradient-to-r from-red-600 to-black flex items-center justify-center ${isSpinning ? 'roulette-wheel' : ''}`}>
                    <div className="text-white text-2xl font-bold">
                      {winningNumber !== null ? winningNumber : '?'}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Current Bets: {bettingManager.getTotalBetAmount()} tokens
                      </p>
                    </div>
                    <Button 
                      onClick={spinWheel} 
                      disabled={isSpinning || bettingManager.getTotalBetAmount() === 0}
                      className="w-full"
                    >
                      {isSpinning ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Spinning...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Spin Wheel
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Complete Betting Table */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Betting Table</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="betting-table p-4 rounded-lg bg-green-800">
                    {/* Zero and Double Zero */}
                    <div className="flex justify-center mb-4 gap-2">
                      <button
                        onClick={() => placeBet('STRAIGHT_UP', [0])}
                        className={`number-cell w-16 h-16 rounded ${getNumberColorClass(0)} text-white font-bold flex items-center justify-center hover:opacity-80`}
                      >
                        0
                      </button>
                      <button
                        onClick={() => placeBet('STRAIGHT_UP', ['00'])}
                        className={`number-cell w-16 h-16 rounded ${getNumberColorClass('00')} text-white font-bold flex items-center justify-center hover:opacity-80`}
                      >
                        00
                      </button>
                    </div>
                    
                    {/* Main Number Grid */}
                    <div className="grid grid-cols-12 gap-1 mb-4">
                      {bettingNumbers.map((row, rowIndex) => 
                        row.map(num => (
                          <button
                            key={num}
                            onClick={() => placeBet('STRAIGHT_UP', [num])}
                            className={`number-cell h-12 rounded ${getNumberColorClass(num)} text-white font-bold flex items-center justify-center text-sm hover:opacity-80`}
                          >
                            {num}
                          </button>
                        ))
                      )}
                    </div>

                    {/* Dozens */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <button
                        onClick={() => placeBet('DOZEN', BETTING_AREAS.FIRST_DOZEN.numbers)}
                        className="bg-green-600 text-white p-3 rounded font-semibold hover:opacity-80"
                      >
                        1st 12
                      </button>
                      <button
                        onClick={() => placeBet('DOZEN', BETTING_AREAS.SECOND_DOZEN.numbers)}
                        className="bg-green-600 text-white p-3 rounded font-semibold hover:opacity-80"
                      >
                        2nd 12
                      </button>
                      <button
                        onClick={() => placeBet('DOZEN', BETTING_AREAS.THIRD_DOZEN.numbers)}
                        className="bg-green-600 text-white p-3 rounded font-semibold hover:opacity-80"
                      >
                        3rd 12
                      </button>
                    </div>

                    {/* Outside Bets */}
                    <div className="grid grid-cols-6 gap-2">
                      <button
                        onClick={() => placeBet('LOW', BETTING_AREAS.LOW.numbers)}
                        className="bg-green-600 text-white p-3 rounded font-semibold hover:opacity-80"
                      >
                        1-18
                      </button>
                      <button
                        onClick={() => placeBet('EVEN', BETTING_AREAS.EVEN.numbers)}
                        className="bg-green-600 text-white p-3 rounded font-semibold hover:opacity-80"
                      >
                        EVEN
                      </button>
                      <button
                        onClick={() => placeBet('RED', BETTING_AREAS.RED.numbers)}
                        className="bg-red-600 text-white p-3 rounded font-semibold hover:opacity-80"
                      >
                        RED
                      </button>
                      <button
                        onClick={() => placeBet('BLACK', BETTING_AREAS.BLACK.numbers)}
                        className="bg-black text-white p-3 rounded font-semibold hover:opacity-80"
                      >
                        BLACK
                      </button>
                      <button
                        onClick={() => placeBet('ODD', BETTING_AREAS.ODD.numbers)}
                        className="bg-green-600 text-white p-3 rounded font-semibold hover:opacity-80"
                      >
                        ODD
                      </button>
                      <button
                        onClick={() => placeBet('HIGH', BETTING_AREAS.HIGH.numbers)}
                        className="bg-green-600 text-white p-3 rounded font-semibold hover:opacity-80"
                      >
                        19-36
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Bets Display */}
            {currentBets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Bets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentBets.map(bet => {
                      const displayInfo = bet.getDisplayInfo();
                      return (
                        <div key={bet.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="text-sm">
                            {displayInfo.description} ({displayInfo.payout})
                          </span>
                          <span className="font-semibold">{displayInfo.amount} tokens</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Games */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Games</CardTitle>
              </CardHeader>
              <CardContent>
                {gameHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No games played yet</p>
                ) : (
                  gameHistory.slice(0, 5).map(game => (
                    <div key={game.id} className="flex justify-between items-center p-3 bg-muted rounded-lg mb-2">
                      <div className="flex items-center gap-3">
                        <Badge className={getNumberColorClass(game.winningNumber) + ' text-white'}>
                          {game.winningNumber}
                        </Badge>
                        <span className="text-sm">{game.timestamp}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Bet: {game.bet}</p>
                        <p className={`text-sm font-bold ${game.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {game.profit >= 0 ? '+' : ''}{game.profit}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Games</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalGames}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.winRate}%</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Profit/Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.profitLoss >= 0 ? '+' : ''}{stats.profitLoss}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${stats.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.roi >= 0 ? '+' : ''}{stats.roi}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Bet:</span>
                    <span className="font-semibold">{stats.averageBet} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Biggest Win:</span>
                    <span className="font-semibold text-green-600">{stats.biggestWin} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Streak:</span>
                    <span className="font-semibold">{stats.longestWinStreak} games</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lose Streak:</span>
                    <span className="font-semibold">{stats.longestLoseStreak} games</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Streak:</span>
                    <span className={`font-semibold ${
                      stats.currentStreak?.type === 'win' ? 'text-green-600' : 
                      stats.currentStreak?.type === 'lose' ? 'text-red-600' : ''
                    }`}>
                      {stats.currentStreak?.type === 'none' ? 'None' : 
                       `${stats.currentStreak?.count} ${stats.currentStreak?.type}${stats.currentStreak?.count > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Bet:</span>
                    <span className="font-semibold">{stats.totalBetAmount.toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Winnings:</span>
                    <span className="font-semibold text-green-600">{stats.totalWinnings.toLocaleString()} tokens</span>
                  </div>
                  {(() => {
                    const bettingAnalysis = analyzeBettingPatterns(gameHistory);
                    return (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Recommendation:</p>
                        <p className="text-sm">{bettingAnalysis.recommendation}</p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Hourly Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Claim {WALLET_CONFIG.HOURLY_TOKENS} tokens every hour (max {WALLET_CONFIG.MAX_TOKENS.toLocaleString()} tokens)
                  </p>
                  {(() => {
                    const { claimableTokens } = calculateClaimableTokens(lastTokenClaim, tokens);
                    const { formatted } = getTimeUntilNextClaim(lastTokenClaim);
                    return (
                      <div className="space-y-2">
                        <p className="text-sm">
                          {claimableTokens > 0 
                            ? `${claimableTokens} tokens available` 
                            : `Next claim: ${formatted}`
                          }
                        </p>
                        <Button 
                          onClick={claimHourlyTokens} 
                          className="w-full"
                          disabled={claimableTokens === 0}
                        >
                          Claim Hourly Tokens
                        </Button>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="w-5 h-5" />
                    Watch Ad for Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const { canWatch, remainingWatches, watchesToday } = canWatchAd(adWatchHistory);
                    const adState = adSystem.getAdState();
                    
                    return (
                      <>
                        <p className="text-muted-foreground">
                          Watch a rewarded ad to get {WALLET_CONFIG.AD_REWARD_TOKENS} bonus tokens
                        </p>
                        <p className="text-sm">
                          Unlimited ads available
                        </p>
                        {adSystemReady && (
                          <p className="text-xs text-muted-foreground">
                            Ad Status: {adState === AD_STATES.LOADED ? 'Ready' : 
                                      adState === AD_STATES.LOADING ? 'Loading...' : 
                                      adState === AD_STATES.SHOWING ? 'Playing...' : 'Preparing...'}
                          </p>
                        )}
                        <Button 
                          onClick={watchAd} 
                          variant="outline" 
                          className="w-full"
                          disabled={!adSystemReady || isWatchingAd}
                        >
                          {isWatchingAd ? 'Watching Ad...' : `Watch Ad (+${WALLET_CONFIG.AD_REWARD_TOKENS} tokens)`}
                        </Button>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;

