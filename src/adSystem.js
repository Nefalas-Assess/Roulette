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
 * AdSystem class to manage ad loading and display
 */
export class AdSystem {
    constructor() {
        this.currentAd = null;
        this.adState = AD_STATES.NOT_LOADED;
        this.adNetwork = null; // e.g., GOOGLE_ADMOB, UNITY_ADS, IRONSOURCE
    }

    initialize(adNetwork) {
        if (!AD_NETWORKS[adNetwork]) {
            console.error(`Invalid ad network: ${adNetwork}`);
            return;
        }
        this.adNetwork = adNetwork;
        console.log(`AdSystem initialized with ${adNetwork}`);
    }

    loadAd(adType) {
        if (!this.adNetwork) {
            console.error('AdSystem not initialized. Call initialize() first.');
            return;
        }
        if (!AD_TYPES[adType]) {
            console.error(`Invalid ad type: ${adType}`);
            return;
        }

        this.adState = AD_STATES.LOADING;
        this.currentAd = adType;
        console.log(`Loading ${adType} ad from ${this.adNetwork}...`);

        // Simulate ad loading time
        setTimeout(() => {
            if (Math.random() > 0.1) { // 90% chance of success
                this.adState = AD_STATES.LOADED;
                console.log(`${adType} ad loaded.`);
            } else {
                this.adState = AD_STATES.FAILED;
                console.error(`${adType} ad failed to load.`);
            }
        }, 2000);
    }

    showAd() {
        if (this.adState !== AD_STATES.LOADED) {
            console.warn('Ad not loaded or already showing.');
            return;
        }

        this.adState = AD_STATES.SHOWING;
        console.log(`Showing ${this.currentAd} ad.`);

        // Simulate ad display time
        setTimeout(() => {
            this.adState = AD_STATES.COMPLETED;
            console.log(`${this.currentAd} ad completed.`);
            this.currentAd = null;
        }, AD_TYPES[this.currentAd].duration * 1000);
    }

    skipAd() {
        if (this.adState === AD_STATES.SHOWING && AD_TYPES[this.currentAd].skipAfter > 0) {
            this.adState = AD_STATES.SKIPPED;
            console.log(`${this.currentAd} ad skipped.`);
            this.currentAd = null;
        } else {
            console.warn('Ad cannot be skipped at this time.');
        }
    }

    getAdState() {
        return this.adState;
    }

    getAdReward() {
        if (this.adState === AD_STATES.COMPLETED && this.currentAd === 'REWARDED_VIDEO') {
            return AD_TYPES.REWARDED_VIDEO.reward;
        }
        return 0;
    }
}

// Exportation par défaut de la classe AdSystem
export default AdSystem;

// Si une instance nommée est nécessaire, elle doit être créée et exportée séparément, ou dans un autre fichier.
// Par exemple, si vous avez besoin d'une instance globale, vous pourriez faire :
// // export const adSystem = new AdSystem();
// Mais cela doit être fait avec précaution pour éviter les conflits de noms si la classe est déjà exportée par défaut.