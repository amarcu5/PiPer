import { getResource } from './../common.js'
import { getButton } from './../button.js'
import { videoPlayingPictureInPicture, togglePictureInPicture } from './../video.js'

export const domain = 'twitch';

export const resource = {
  buttonClassName: 'player-button',
  buttonDidAppear: function() {
    const neighbourButton = document.querySelector('.qa-fullscreen-button');
    const neighbourTooltip = /** @type {HTMLElement} */ (neighbourButton.querySelector('.player-tip'));
    const button = getButton();
    const title = button.title;
    const /** string */ neighbourTitle = neighbourTooltip.dataset['tip'];
    button.title = '';
    button.addEventListener('mouseover', function() {
      neighbourTooltip.dataset['tip'] = title;
      neighbourTooltip.style.display = 'block';
    });
    button.addEventListener('mouseout', function() {
      neighbourTooltip.style.display = '';
      neighbourTooltip.dataset['tip'] = neighbourTitle;
    });
    neighbourButton.addEventListener('click', function() {
      const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement());
      if (videoPlayingPictureInPicture(video)) togglePictureInPicture(video);
    });
    neighbourButton.style.order = 2;

    // Ensure "Watch on Twitch" button is the rightmost button
    const twitchButton = document.querySelector('.qa-watch-twitch-button');
    if (twitchButton) twitchButton.style.order = 3;
  },
  buttonHoverStyle: /** CSS */ (`
    filter: brightness(50%) sepia(1) hue-rotate(219deg) saturate(117%) brightness(112%);
  `),
  buttonParent: function() {
    return document.querySelector('.player-buttons-right');
  },
  buttonScale: 0.8,
  buttonStyle: /** CSS */ (`order: 1`),
  captionElement: function() {
    return document.querySelector('.player-captions-container');
  },
  videoElement: function() {
    return document.querySelector('.player-video video');
  },
};