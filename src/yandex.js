export const yandex = {
  ysdk: null,
  player: null,
  ready: false,

  async init() {
    try {
      if (!window.YaGames) {
        console.info('[Yandex SDK] Local mode: SDK not found.');
        return false;
      }
      this.ysdk = await window.YaGames.init();
      this.ready = true;

      try {
        this.player = await this.ysdk.getPlayer({ scopes: false });
      } catch (error) {
        console.warn('[Yandex SDK] Player unavailable:', error);
      }
      return true;
    } catch (error) {
      console.warn('[Yandex SDK] Init failed:', error);
      return false;
    }
  },

  gameReady() {
    try {
      this.ysdk?.features?.LoadingAPI?.ready?.();
    } catch (error) {
      console.warn('[Yandex SDK] LoadingAPI.ready failed:', error);
    }
  },

  gameplayStart() {
    try {
      this.ysdk?.features?.GameplayAPI?.start?.();
    } catch (error) {
      console.warn('[Yandex SDK] GameplayAPI.start failed:', error);
    }
  },

  gameplayStop() {
    try {
      this.ysdk?.features?.GameplayAPI?.stop?.();
    } catch (error) {
      console.warn('[Yandex SDK] GameplayAPI.stop failed:', error);
    }
  },

  async save(data) {
    localStorage.setItem('royalChessQuestSave', JSON.stringify(data));
    try {
      if (this.player?.setData) await this.player.setData(data, true);
    } catch (error) {
      console.warn('[Yandex SDK] Cloud save failed:', error);
    }
  },

  async load(defaultData) {
    try {
      if (this.player?.getData) {
        const remote = await this.player.getData();
        if (remote && Object.keys(remote).length) return { ...defaultData, ...remote };
      }
    } catch (error) {
      console.warn('[Yandex SDK] Cloud load failed:', error);
    }

    try {
      const local = JSON.parse(localStorage.getItem('royalChessQuestSave') || 'null');
      return local ? { ...defaultData, ...local } : defaultData;
    } catch {
      return defaultData;
    }
  },

  showRewarded({ onRewarded, onClose, onError } = {}) {
    if (!this.ysdk?.adv?.showRewardedVideo) {
      onRewarded?.();
      onClose?.();
      return;
    }

    this.gameplayStop();
    this.ysdk.adv.showRewardedVideo({
      callbacks: {
        onOpen: () => console.info('[Ads] Rewarded opened'),
        onRewarded: () => onRewarded?.(),
        onClose: () => {
          this.gameplayStart();
          onClose?.();
        },
        onError: (error) => {
          this.gameplayStart();
          console.warn('[Ads] Rewarded error:', error);
          onError?.(error);
        }
      }
    });
  },

  showInterstitial({ onClose, onError } = {}) {
    if (!this.ysdk?.adv?.showFullscreenAdv) {
      onClose?.();
      return;
    }

    this.gameplayStop();
    this.ysdk.adv.showFullscreenAdv({
      callbacks: {
        onClose: () => {
          this.gameplayStart();
          onClose?.();
        },
        onError: (error) => {
          this.gameplayStart();
          console.warn('[Ads] Fullscreen error:', error);
          onError?.(error);
        }
      }
    });
  }
};
