import { getResource } from './../common.js'
import { videoPlayingPictureInPicture, togglePictureInPicture } from './../video.js'

export const domain = 'pbs';

export const resource = {
  buttonClassName: 'jw-icon jw-icon-inline jw-button-color jw-reset',
  buttonDidAppear: function() {
    const fullscreenButton = document.querySelector('.jw-icon-fullscreen');
    fullscreenButton.addEventListener('click', function() {
      const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement());
      if (videoPlayingPictureInPicture(video)) togglePictureInPicture(video);
    });
  },
  buttonElementType: 'div',
  buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('.jw-button-container');
  },
  buttonScale: 0.6,
  buttonStyle: /** CSS */ (`opacity: 0.8`),
  videoElement: function() {
    return document.querySelector('.jw-video');
  },
};