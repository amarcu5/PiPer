import { Browser, getBrowser, getResource, bypassBackgroundTimerThrottling } from './../common.js'
import { getButton } from './../button.js'
import { enableCaptions, disableCaptions, shouldProcessCaptions } from './../captions.js'

export const domain = ['youtube', 'youtu'];

export const resource = {
  buttonClassName: 'ytp-button',
  buttonDidAppear: function() {
    const button = getButton();
    const neighbourButton = /** @type {?HTMLElement} */ (button.nextSibling);
    const /** string */ title = button.title;
    const /** string */ neighbourTitle = neighbourButton.title;
    button.title = '';
    button.addEventListener('mouseover', function() {
      neighbourButton.title = title;
      neighbourButton.dispatchEvent(new Event('mouseover'));
    });
    button.addEventListener('mouseout', function() {
      neighbourButton.dispatchEvent(new Event('mouseout'));
      neighbourButton.title = neighbourTitle;
    });
    bypassBackgroundTimerThrottling();

    // Workaround Safari bug; old captions persist in Picture in Picture mode when MediaSource buffers change
    if (getBrowser() == Browser.SAFARI) {
      const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement());
      let captionsVisible = false;
      const navigateStart = function() {
        captionsVisible = shouldProcessCaptions();
        if (captionsVisible) disableCaptions();
      };
      const navigateFinish = function() {
        if (captionsVisible) enableCaptions();
      };
      window.addEventListener('spfrequest', navigateStart);
      window.addEventListener('spfdone', navigateFinish);
      window.addEventListener('yt-navigate-start', navigateStart);
      window.addEventListener('yt-navigate-finish', navigateFinish);
    }
  },
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('.ytp-right-controls');
  },
  buttonScale: 0.68,
  captionElement: function() {
    return document.querySelector('.caption-window');
  },
  videoElement: function() {
    return document.querySelector('video.html5-main-video');
  },
};