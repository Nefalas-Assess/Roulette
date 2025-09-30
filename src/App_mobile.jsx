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
  RotateCcw,
  Trophy,
  Bell
} from 'lucide-react';
import { 
  generateWinningNumber, 
  getNumberColor, 
  calculatePayout,
  AMERICAN_ROULETTE_NUMBERS 
} from './utils/rouletteLogic';
import { BettingManager } from './utils/bettingSystem';
import { WalletManager } from './utils/walletSystem';
import { StatisticsEngine } from './utils/statisticsEngine';
import { AdSystem } from './utils/adSystem';
import { AchievementSystem } from './utils/achievementSystem';
import { NotificationSystem } from './utils/notificationSystem';

function App() {
  // Game state
  const [winningNumber, setWinningNumber] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  
  // Betting system
  const [bettingManager] = useState(new BettingManager());
  const [selectedBetAmount, setSelectedBetAmount] = useState(5);
  const [currentBets, setCurrentBets] = useState({});
  
  // Wallet system
  const [walletManager] = useState(new WalletManager());
  const [tokens, setTokens] = useState(1000);
  const [nextClaimTime, setNextClaimTime] = useState(null);
  
  // Statistics
  const [statisticsEngine] = useState(new StatisticsEngine());
  const [stats, setStats] = useState({});
  
  // Ad system
  const [adSystem] = useState(new AdSystem());
  const [adStatus, setAdStatus] = useState('ready');
  
  // Achievement system
  const [achievementSystem] = useState(new AchievementSystem());
  const [achievements, setAchievements] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  
  // Notification system
  const [notificationSystem] = useState(new NotificationSystem());
  const [notifications, setNotifications] = useState([]);
  
  // Mobile UI state
  const [activeTab, setActiveTab] = useState('game');
  const [showAchievements, setShowAchievements] = useState(false);

  // Initialize systems
  useEffect(() => {
    // Load saved data
    const savedTokens = walletManager.getTokens();
    setTokens(savedTokens);
    
    const savedStats = statisticsEngine.getStats();
    setStats(savedStats);
    
    const savedAchievements = achievementSystem.getUnlockedAchievements();
    setUnlockedAchievements(savedAchievements);
    
    // Initialize ad system
    adSystem.initialize();
    
    // Set up notification listener
    notificationSystem.onNotification((notification) => {
      setNotifications(prev => [...prev, notification]);
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    });
    
    // Update next claim time
    updateNextClaimTime();
    
    // Set up hourly timer
    const timer = setInterval(updateNextClaimTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const updateNextClaimTime = () => {
    const nextClaim = walletManager.getNextClaimTime();
    setNextClaimTime(nextClaim);
  };

  const placeBet = (betType, betValue) => {
    if (isSpinning) return;
    
    const success = bettingManager.placeBet(betType, betValue, selectedBetAmount, tokens);
    if (success) {
      setTokens(prev => prev - selectedBetAmount);
      setCurrentBets(bettingManager.getCurrentBets());
      walletManager.updateTokens(tokens - selectedBetAmount);
    }
  };

  const clearAllBets = () => {
    if (isSpinning) return;
    
    const refund = bettingManager.clearAllBets();
    setTokens(prev => prev + refund);
    setCurrentBets({});
    walletManager.updateTokens(tokens + refund);
  };

  const spinWheel = () => {
    if (isSpinning || bettingManager.getTotalBetAmount() === 0) return;
    
    setIsSpinning(true);
    const result = generateWinningNumber();
    
    // Simulate spinning animation (3 seconds)
    setTimeout(() => {
      setWinningNumber(result);
      
      // Calculate winnings
      const winnings = bettingManager.calculateWinnings(result);
      const totalBet = bettingManager.getTotalBetAmount();
      const profit = winnings - totalBet;
      
      // Update tokens
      const newTokens = tokens + winnings;
      setTokens(newTokens);
      walletManager.updateTokens(newTokens);
      
      // Record game
      const gameResult = {
        number: result,
        bets: { ...currentBets },
        totalBet,
        winnings,
        profit,
        timestamp: Date.now()
      };
      
      setGameHistory(prev => [gameResult, ...prev.slice(0, 99)]);
      statisticsEngine.recordGame(gameResult);
      setStats(statisticsEngine.getStats());
      
      // Check achievements
      const newAchievements = achievementSystem.checkAchievements(gameResult, stats);
      if (newAchievements.length > 0) {
        setUnlockedAchievements(prev => [...prev, ...newAchievements]);
        newAchievements.forEach(achievement => {
          notificationSystem.showAchievement(achievement);
        });
      }
      
      // Show game result notification
      if (profit > 0) {
        notificationSystem.showWin(profit);
      } else {
        notificationSystem.showLoss(Math.abs(profit));
      }
      
      // Clear bets
      bettingManager.clearAllBets();
      setCurrentBets({});
      setIsSpinning(false);
    }, 3000);
  };

  const claimHourlyTokens = () => {
    const claimed = walletManager.claimHourlyTokens();
    if (claimed > 0) {
      setTokens(prev => prev + claimed);
      updateNextClaimTime();
      notificationSystem.showTokensClaimed(claimed);
    }
  };

  const watchAd = async () => {
    setAdStatus('loading');
    try {
      const reward = await adSystem.showRewardedAd();
      if (reward > 0) {
        const newTokens = tokens + reward;
        setTokens(newTokens);
        walletManager.updateTokens(newTokens);
        notificationSystem.showAdReward(reward);
      }
    } catch (error) {
      console.error('Ad failed:', error);
    } finally {
      setAdStatus('ready');
    }
  };

  const formatTime = (ms) => {
    if (ms <= 0) return '00:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getBetChipStyle = (betType, betValue) => {
    const bet = currentBets[`${betType}-${betValue}`];
    if (!bet) return { display: 'none' };
    
    return {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10,
      backgroundColor: selectedBetAmount === 1 ? '#8b5cf6' : 
                     selectedBetAmount === 5 ? '#06b6d4' :
                     selectedBetAmount === 10 ? '#f59e0b' :
                     selectedBetAmount === 25 ? '#dc2626' : '#059669',
      color: 'white',
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: 'bold',
      border: '2px solid white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-yellow-400">🎰 Roulette</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAchievements(!showAchievements)}
              className="text-yellow-400"
            >
              <Trophy className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
              <Coins className="w-4 h-4" />
              {tokens.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg shadow-lg max-w-xs ${
              notification.type === 'win' ? 'bg-green-600' :
              notification.type === 'loss' ? 'bg-red-600' :
              notification.type === 'achievement' ? 'bg-yellow-600' :
              'bg-blue-600'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'achievement' && <Trophy className="w-4 h-4" />}
              {notification.type === 'win' && <TrendingUp className="w-4 h-4" />}
              {notification.type === 'loss' && <TrendingDown className="w-4 h-4" />}
              <div>
                <p className="font-semibold text-sm">{notification.title}</p>
                <p className="text-xs opacity-90">{notification.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="game" className="p-4 space-y-4">
            {/* Hot & Cold Numbers */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1 text-red-400">
                    <TrendingUp className="w-4 h-4" />
                    Hot Numbers
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-1 flex-wrap">
                    {statisticsEngine.getHotNumbers().map(num => (
                      <Badge key={num} variant="destructive" className="text-xs">
                        {num}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1 text-blue-400">
                    <TrendingDown className="w-4 h-4" />
                    Cold Numbers
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-1 flex-wrap">
                    {statisticsEngine.getColdNumbers().map(num => (
                      <Badge key={num} variant="secondary" className="text-xs">
                        {num}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bet Amount Selector */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Select Bet Amount</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-5 gap-2">
                  {[1, 5, 10, 25, 50].map(amount => (
                    <Button
                      key={amount}
                      variant={selectedBetAmount === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedBetAmount(amount)}
                      className={`text-xs ${
                        selectedBetAmount === amount 
                          ? 'bg-yellow-500 text-black hover:bg-yellow-600' 
                          : 'border-slate-600 hover:bg-slate-700'
                      }`}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={clearAllBets}
                    disabled={isSpinning || Object.keys(currentBets).length === 0}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Clear Bets
                  </Button>
                  <span className="text-xs text-slate-400">
                    Total: {bettingManager.getTotalBetAmount()} tokens
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Roulette Wheel */}
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="relative mx-auto w-48 h-48 mb-4">
                  {/* Simple wheel representation for now */}
                  <div className={`w-full h-full rounded-full border-8 border-yellow-500 bg-gradient-to-r from-red-600 to-black flex items-center justify-center ${isSpinning ? 'animate-spin' : ''}`}>
                    <div className="text-white text-2xl font-bold">
                      {winningNumber !== null ? winningNumber : '?'}
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={spinWheel} 
                  disabled={isSpinning || bettingManager.getTotalBetAmount() === 0}
                  className="w-full bg-yellow-500 text-black hover:bg-yellow-600"
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
              </CardContent>
            </Card>

            {/* Mobile Betting Table */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Betting Table</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Numbers Grid */}
                <div className="space-y-2">
                  {/* Zero Section */}
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => placeBet('straight', 0)}
                      className="relative bg-green-600 hover:bg-green-700 border-green-500 text-white text-xs h-8"
                      disabled={isSpinning}
                    >
                      0
                      <div style={getBetChipStyle('straight', 0)}>{selectedBetAmount}</div>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => placeBet('straight', '00')}
                      className="relative bg-green-600 hover:bg-green-700 border-green-500 text-white text-xs h-8"
                      disabled={isSpinning}
                    >
                      00
                      <div style={getBetChipStyle('straight', '00')}>{selectedBetAmount}</div>
                    </Button>
                  </div>

                  {/* Numbers 1-36 */}
                  <div className="grid grid-cols-6 gap-1">
                    {Array.from({length: 36}, (_, i) => i + 1).map(num => (
                      <Button
                        key={num}
                        variant="outline"
                        size="sm"
                        onClick={() => placeBet('straight', num)}
                        className={`relative text-xs h-8 ${
                          getNumberColor(num) === 'red' 
                            ? 'bg-red-600 hover:bg-red-700 border-red-500 text-white'
                            : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-white'
                        }`}
                        disabled={isSpinning}
                      >
                        {num}
                        <div style={getBetChipStyle('straight', num)}>{selectedBetAmount}</div>
                      </Button>
                    ))}
                  </div>

                  {/* Dozens */}
                  <div className="grid grid-cols-3 gap-1 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => placeBet('dozen', 1)}
                      className="relative bg-slate-700 hover:bg-slate-600 border-slate-600 text-white text-xs h-8"
                      disabled={isSpinning}
                    >
                      1st 12
                      <div style={getBetChipStyle('dozen', 1)}>{selectedBetAmount}</div>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => placeBet('dozen', 2)}
                      className="relative bg-slate-700 hover:bg-slate-600 border-slate-600 text-white text-xs h-8"
                      disabled={isSpinning}
                    >
                      2nd 12
                      <div style={getBetChipStyle('dozen', 2)}>{selectedBetAmount}</div>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => placeBet('dozen', 3)}
                      className="relative bg-slate-700 hover:bg-slate-600 border-slate-600 text-white text-xs h-8"
                      disabled={isSpinning}
                    >
                      3rd 12
                      <div style={getBetChipStyle('dozen', 3)}>{selectedBetAmount}</div>
                    </Button>
                  </div>

                  {/* Even Money Bets */}
                  <div className="grid grid-cols-2 gap-1 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => placeBet('even_money', '1-18')}
                      className="relative bg-slate-700 hover:bg-slate-600 border-slate-600 text-white text-xs h-8"
                      disabled={isSpinning}
                    >
                      1-18
                      <div style={getBetChipStyle('even_money', '1-18')}>{selectedBetAmount}</div>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => placeBet('even_money', '19-36')}
                      className="relative bg-slate-700 hover:bg-slate-600 border-slate-600 text-white text-xs h-8"
                      disabled={isSpinning}
                    >
                      19-36
                      <div style={getBetChipStyle('even_money', '19-36')}>{selectedBetAmount}</div>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => placeBet('even_money', 'even')}
                      className="relative bg-slate-700 hover:bg-slate-600 border-slate-600 text-white text-xs h-8"
                      disabled={isSpinning}
                    >
                      EVEN
                      <div style={getBetChipStyle('even_money', 'even')}>{selectedBetAmount}</div>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => placeBet('even_money', 'odd')}
                      className="relative bg-slate-700 hover:bg-slate-600 border-slate-600 text-white text-xs h-8"
                      disabled={isSpinning}
                    >
                      ODD
                      <div style={getBetChipStyle('even_money', 'odd')}>{selectedBetAmount}</div>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => placeBet('even_money', 'red')}
                      className="relative bg-red-600 hover:bg-red-700 border-red-500 text-white text-xs h-8"
                      disabled={isSpinning}
                    >
                      RED
                      <div style={getBetChipStyle('even_money', 'red')}>{selectedBetAmount}</div>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => placeBet('even_money', 'black')}
                      className="relative bg-gray-800 hover:bg-gray-700 border-gray-600 text-white text-xs h-8"
                      disabled={isSpinning}
                    >
                      BLACK
                      <div style={getBetChipStyle('even_money', 'black')}>{selectedBetAmount}</div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Games */}
            {gameHistory.length > 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recent Games</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {gameHistory.slice(0, 3).map((game, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={getNumberColor(game.number) === 'red' ? 'destructive' : 
                                   getNumberColor(game.number) === 'black' ? 'secondary' : 'default'}
                            className="w-6 h-6 rounded-full flex items-center justify-center p-0"
                          >
                            {game.number}
                          </Badge>
                          <span className="text-slate-400">
                            {new Date(game.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className={`font-semibold ${game.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {game.profit > 0 ? '+' : ''}{game.profit}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stats" className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{stats.totalGames || 0}</div>
                    <div className="text-xs text-slate-400">Total Games</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{((stats.winRate || 0) * 100).toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">Win Rate</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-3 text-center">
                    <div className={`text-2xl font-bold ${(stats.totalProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.totalProfit || 0}
                    </div>
                    <div className="text-xs text-slate-400">Profit/Loss</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-3 text-center">
                    <div className={`text-2xl font-bold ${(stats.roi || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {((stats.roi || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-400">ROI</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="wallet" className="p-4">
            <div className="space-y-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Hourly Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-slate-400 mb-3">
                    Claim 200 tokens every hour (max 9,999,999,999 tokens)
                  </p>
                  <div className="text-sm mb-3">
                    Next claim: {formatTime(nextClaimTime)}
                  </div>
                  <Button
                    onClick={claimHourlyTokens}
                    disabled={nextClaimTime > 0}
                    className="w-full bg-yellow-500 text-black hover:bg-yellow-600"
                    size="sm"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Claim Hourly Tokens
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Watch Ad for Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-slate-400 mb-3">
                    Watch a rewarded ad to get 500 bonus tokens
                  </p>
                  <p className="text-xs text-green-400 mb-3">
                    Unlimited ads available
                  </p>
                  <Button
                    onClick={watchAd}
                    disabled={adStatus !== 'ready'}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    {adStatus === 'loading' ? 'Watching Ad...' : 'Watch Ad (+500 tokens)'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700">
        <div className="grid grid-cols-3 h-16">
          <Button
            variant="ghost"
            onClick={() => setActiveTab('game')}
            className={`h-full rounded-none flex flex-col gap-1 ${
              activeTab === 'game' ? 'text-yellow-400 bg-slate-800' : 'text-slate-400'
            }`}
          >
            <Play className="w-5 h-5" />
            <span className="text-xs">Game</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('stats')}
            className={`h-full rounded-none flex flex-col gap-1 ${
              activeTab === 'stats' ? 'text-yellow-400 bg-slate-800' : 'text-slate-400'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Stats</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('wallet')}
            className={`h-full rounded-none flex flex-col gap-1 ${
              activeTab === 'wallet' ? 'text-yellow-400 bg-slate-800' : 'text-slate-400'
            }`}
          >
            <Coins className="w-5 h-5" />
            <span className="text-xs">Wallet</span>
          </Button>
        </div>
      </div>

      {/* Achievements Modal */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Achievements
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAchievements(false)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievementSystem.getAllAchievements().map(achievement => {
                  const isUnlocked = unlockedAchievements.some(a => a.id === achievement.id);
                  return (
                    <div
                      key={achievement.id}
                      className={`p-3 rounded-lg border ${
                        isUnlocked 
                          ? 'bg-yellow-500/20 border-yellow-500/50' 
                          : 'bg-slate-700/50 border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className={`font-semibold text-sm ${
                            isUnlocked ? 'text-yellow-400' : 'text-slate-300'
                          }`}>
                            {achievement.name}
                          </h4>
                          <p className="text-xs text-slate-400">{achievement.description}</p>
                        </div>
                        {isUnlocked && (
                          <Trophy className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default App;

