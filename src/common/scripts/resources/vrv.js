import { getResource, bypassBackgroundTimerThrottling } from './../common.js'
import { getButton } from './../button.js'
import { videoPlayingPictureInPicture, togglePictureInPicture } from './../video.js'

export const domain = 'vrv';

export const resource = {
  buttonClassName: 'vjs-control vjs-button',
  buttonDidAppear: function() {
    const neighbourButton = getButton().nextSibling;
    neighbourButton.addEventListener('click', function() {
      const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement());
      if (videoPlayingPictureInPicture(video)) togglePictureInPicture(video);
    });
    bypassBackgroundTimerThrottling();
  },
  buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('.vjs-control-bar');
  },
  buttonScale: 0.6,
  buttonStyle: /** CSS */ (`
    position: absolute;
    right: 114px;
    width: 50px;
    cursor: pointer;
    opacity: 0.6;
  `),
  captionElement: function() {
    return document.querySelector('.libjass-subs');
  },
  videoElement: function() {
    return document.getElementById('player_html5_api');
  },
};
