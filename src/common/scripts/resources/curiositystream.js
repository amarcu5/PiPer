import { Browser, getBrowser, getResource } from './../common.js'

export const domain = 'curiositystream';

export const resource = {
  buttonClassName: 'vjs-control vjs-button',
  buttonDidAppear: function() {
    if (getBrowser() != Browser.SAFARI) return;
    const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement());
    const videoContainer = video.parentElement;
    video.addEventListener('webkitbeginfullscreen', function() {
      const height = Math.floor(100 * video.videoHeight / video.videoWidth) + 'vw';
      const maxHeight = video.videoHeight + 'px';
      videoContainer.style.setProperty('height', height, 'important');
      videoContainer.style.setProperty('max-height', maxHeight);
    });
    video.addEventListener('webkitendfullscreen', function() {
      videoContainer.style.removeProperty('height');
      videoContainer.style.removeProperty('max-height');
    });
  },
  buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    const e = document.getElementById('main-player');
    return e && e.querySelector('.vjs-control-bar');
  },
  buttonScale: 0.7,
  buttonStyle: /** CSS */ (`
    opacity: 0.8;
    cursor: pointer;
  `),
  videoElement: function() {
    return document.getElementById('main-player_html5_api');
  },
};