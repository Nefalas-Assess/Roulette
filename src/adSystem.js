// Advertising system simulation for mobile app integration

/**
 * Simulated ad networks configuration
 */
export const AD_NETWORKS = {
  GOOGLE_ADMOB: {
    name: 'Google AdMob',
    rewardedAdUnitId: 'ca-app-pub-3940256099942544/5224354917', // Test ID
    interstitialAdUnitId: 'ca-app-pub-3940256099942544/1033173712', // Test ID
    bannerAdUnitId: 'ca-app-pub-3940256099942544/6300978111' // Test ID
  },
  UNITY_ADS: {
    name: 'Unity Ads',
    gameId: '1234567', // Test ID
    placementId: 'rewardedVideo'
  },
  IRONSOURCE: {
    name: 'IronSource',
    appKey: 'test_app_key',
    placementName: 'DefaultRewardedVideo'
  }
};

/**
 * Ad types and their configurations
 */
export const AD_TYPES = {
  REWARDED_VIDEO: {
    name: 'Rewarded Video',
    duration: 30, // seconds
    reward: 500, // tokens
    skipAfter: 5 // seconds before skip button appears
  },
  INTERSTITIAL: {
    name: 'Interstitial',
    duration: 5, // seconds
    reward: 0 // no reward
  },
  BANNER: {
    name: 'Banner',
    duration: 0, // persistent
    reward: 0 // no reward
  }
};

/**
 * Simulated ad loading states
 */
export const AD_STATES = {
  NOT_LOADED: 'not_loaded',
  LOADING: 'loading',
  LOADED: 'loaded',
  SHOWING: 'showing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped'
};

/**
 * Ad system class to manage ad operations
 */
export class AdSystem {
  constructor() {
    this.currentNetwork = AD_NETWORKS.GOOGLE_ADMOB;
    this.adState = AD_STATES.NOT_LOADED;
    this.loadingPromise = null;
    this.showingPromise = null;
  }

  /**
   * Initialize the ad system
   * @param {string} networkName - Name of the ad network to use
   * @returns {Promise<boolean>} Success status
   */
  async initialize(networkName = 'GOOGLE_ADMOB') {
    try {
      this.currentNetwork = AD_NETWORKS[networkName];
      console.log(`Initializing ${this.currentNetwork.name}...`);
      
      // Simulate initialization delay
      await this.delay(1000);
      
      console.log(`${this.currentNetwork.name} initialized successfully`);
      return true;
    } catch (error) {
      console.error('Ad system initialization failed:', error);
      return false;
    }
  }

  /**
   * Load a rewarded video ad
   * @returns {Promise<boolean>} Load success status
   */
  async loadRewardedAd() {
    if (this.adState === AD_STATES.LOADING) {
      return this.loadingPromise;
    }

    this.adState = AD_STATES.LOADING;
    console.log('Loading rewarded ad...');

    this.loadingPromise = new Promise(async (resolve) => {
      try {
        // Simulate network request delay
        await this.delay(2000);
        
        // Simulate 90% success rate
        const success = Math.random() > 0.1;
        
        if (success) {
          this.adState = AD_STATES.LOADED;
          console.log('Rewarded ad loaded successfully');
          resolve(true);
        } else {
          this.adState = AD_STATES.FAILED;
          console.log('Failed to load rewarded ad');
          resolve(false);
        }
      } catch (error) {
        this.adState = AD_STATES.FAILED;
        console.error('Error loading rewarded ad:', error);
        resolve(false);
      }
    });

    return this.loadingPromise;
  }

  /**
   * Show a rewarded video ad
   * @returns {Promise<Object>} Result object with success, reward, and reason
   */
  async showRewardedAd() {
    if (this.adState !== AD_STATES.LOADED) {
      return {
        success: false,
        reward: 0,
        reason: 'Ad not loaded'
      };
    }

    if (this.adState === AD_STATES.SHOWING) {
      return this.showingPromise;
    }

    this.adState = AD_STATES.SHOWING;
    console.log('Showing rewarded ad...');

    this.showingPromise = new Promise(async (resolve) => {
      try {
        const adConfig = AD_TYPES.REWARDED_VIDEO;
        
        // Simulate ad display duration
        await this.delay(adConfig.duration * 1000);
        
        // Simulate user completion rate (80% complete, 20% skip)
        const completed = Math.random() > 0.2;
        
        if (completed) {
          this.adState = AD_STATES.COMPLETED;
          console.log('Rewarded ad completed - reward earned!');
          resolve({
            success: true,
            reward: adConfig.reward,
            reason: 'Ad completed successfully'
          });
        } else {
          this.adState = AD_STATES.SKIPPED;
          console.log('Rewarded ad skipped - no reward');
          resolve({
            success: false,
            reward: 0,
            reason: 'Ad was skipped'
          });
        }
      } catch (error) {
        this.adState = AD_STATES.FAILED;
        console.error('Error showing rewarded ad:', error);
        resolve({
          success: false,
          reward: 0,
          reason: 'Ad display error'
        });
      }
    });

    return this.showingPromise;
  }

  /**
   * Check if a rewarded ad is available
   * @returns {boolean} Availability status
   */
  isRewardedAdAvailable() {
    return this.adState === AD_STATES.LOADED;
  }

  /**
   * Get current ad state
   * @returns {string} Current ad state
   */
  getAdState() {
    return this.adState;
  }

  /**
   * Reset ad state (for testing purposes)
   */
  reset() {
    this.adState = AD_STATES.NOT_LOADED;
    this.loadingPromise = null;
    this.showingPromise = null;
  }

  /**
   * Utility method to create delays
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Global ad system instance
 */
export const adSystem = new AdSystem();

/**
 * Initialize ad system with error handling
 * @param {string} networkName - Ad network to initialize
 * @returns {Promise<boolean>} Initialization success
 */
export async function initializeAds(networkName = 'GOOGLE_ADMOB') {
  try {
    return await adSystem.initialize(networkName);
  } catch (error) {
    console.error('Failed to initialize ad system:', error);
    return false;
  }
}

/**
 * Show rewarded ad with automatic loading
 * @returns {Promise<Object>} Ad result
 */
export async function showRewardedAdWithLoading() {
  try {
    // Check if ad is already loaded
    if (!adSystem.isRewardedAdAvailable()) {
      console.log('Ad not loaded, loading now...');
      const loaded = await adSystem.loadRewardedAd();
      
      if (!loaded) {
        return {
          success: false,
          reward: 0,
          reason: 'Failed to load ad'
        };
      }
    }

    // Show the ad
    return await adSystem.showRewardedAd();
  } catch (error) {
    console.error('Error in showRewardedAdWithLoading:', error);
    return {
      success: false,
      reward: 0,
      reason: 'System error'
    };
  }
}

/**
 * Preload ads for better user experience
 */
export async function preloadAds() {
  try {
    console.log('Preloading ads...');
    await adSystem.loadRewardedAd();
  } catch (error) {
    console.error('Error preloading ads:', error);
  }
}

