import { getResource } from './../common.js'
import { getButton } from './../button.js'
import { videoPlayingPictureInPicture, togglePictureInPicture } from './../video.js'

export const domain = 'twitch';

export const resource = {
  buttonClassName: 'tw-border-bottom-left-radius-medium tw-border-bottom-right-radius-medium tw-border-top-left-radius-medium tw-border-top-right-radius-medium tw-button-icon tw-button-icon--overlay tw-core-button tw-core-button--overlay tw-inline-flex tw-relative tw-tooltip-wrapper',
  buttonDidAppear: function() {
    // Add tooltip
    const button = getButton();
    const title = button.title;
    button.title = '';
    const tooltip = /** @type {HTMLElement} */ (document.createElement('div'));
    tooltip.className = 'tw-tooltip tw-tooltip--align-right tw-tooltip--up';
    tooltip.appendChild(document.createTextNode(title));
    button.appendChild(tooltip);
    
    // Fix issues with fullscreen when activated while video playing Picture-in-Picture
    const fullscreenButton = document.querySelector("[data-a-target='player-fullscreen-button']");
    if (!fullscreenButton) return;
    fullscreenButton.addEventListener('click', function() {
      const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement());
      if (videoPlayingPictureInPicture(video)) togglePictureInPicture(video);
    });
  },
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('.player-controls__right-control-group,.player-buttons-right');
  },
  buttonScale: 0.8,
  captionElement: function() {
    return document.querySelector('.player-captions-container');
  },
  videoElement: function() {
    return document.querySelector('video[src]');
  },
};