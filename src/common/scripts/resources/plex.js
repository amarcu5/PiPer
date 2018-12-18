import { bypassBackgroundTimerThrottling } from './../common.js'

export const domain = 'plex';

export const resource = {
  buttonDidAppear: function() {
    bypassBackgroundTimerThrottling();
  },
  buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    const e = document.querySelector('div[class^="FullPlayerTopControls-topControls"]');
    return /** @type {?Element} */ (e && e.lastChild);
  },
  buttonScale: 2,
  buttonStyle: /** CSS */ (`
    position: relative;
    top: -3px;
    width: 30px;
    padding: 10px;
    border: 0px;
    background: transparent;
    opacity: 0.7;
    outline: 0;
    text-shadow: 0px 0px 4px rgba(0, 0, 0, 0.45);
  `),
  captionElement: function() {
    return document.querySelector('.libjass-subs');
  },
  videoElement: function() {
    return document.querySelector('video[class^="HTMLMedia-mediaElement"]');
  },
};