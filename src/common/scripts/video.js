import { info } from './logger.js'
import { Browser, getBrowser } from './common.js'

const CHROME_PLAYING_PIP_ATTRIBUTE = 'data-playing-picture-in-picture';

/**
 * Toggles video Picture in Picture
 *
 * @param {HTMLVideoElement} video - video element to toggle Picture in Picture mode
 */
export const togglePictureInPicture = function(video) {
  const playingPictureInPicture = videoPlayingPictureInPicture(video);
  switch (getBrowser()) {
    case Browser.SAFARI:
      if (playingPictureInPicture) {
      	video.webkitSetPresentationMode('inline');
      } else {
        video.webkitSetPresentationMode('picture-in-picture');
      }
      break;
    case Browser.CHROME:
      if (playingPictureInPicture) {
        // Workaround Chrome content scripts being unable to call 'exitPictureInPicture' directly
        const script = document.createElement('script');
        script.textContent = 'document.exitPictureInPicture()';
        document.head.appendChild(script);
        script.remove();
      } else {
        video.requestPictureInPicture();
      }
      break;
    case Browser.UNKNOWN:
    default:
      break;
  }
};

/**
 * Returns true if video is playing Picture in Picture
 *
 * @param {HTMLVideoElement} video - video element to test
 * @return {boolean} 
 */
export const videoPlayingPictureInPicture = function(video) {
  switch (getBrowser()) {
    case Browser.SAFARI:
      return video.webkitPresentationMode == 'picture-in-picture';
    case Browser.CHROME:
      return video.hasAttribute(CHROME_PLAYING_PIP_ATTRIBUTE);
    case Browser.UNKNOWN:
    default:
      return false;
  }
};

/**
 * Sets Picture in Picture attribute and toggles captions on entering Picture in Picture mode
 *
 * @param {!Event} event - an enterpictureinpicture event
 */
const videoDidEnterPictureInPicture = function(event) {
  info('Video entering Picture in Picture mode');

  const video = /** @type {HTMLVideoElement} */ (event.target);

  // Toggle captions; Avoid circular referencing by calling 'videoPresentationModeChanged' directly
  const presentationEvent = new Event('webkitpresentationmodechanged', { bubbles: true });
  video.dispatchEvent(presentationEvent);

  // Set playing in Picture in Picture mode attribute
  video.setAttribute(CHROME_PLAYING_PIP_ATTRIBUTE, true);

  // Remove Picture in Picture attribute and toggle captions on leaving Picture in Picture mode
  video.addEventListener('leavepictureinpicture', function(event) {
    info('Video leaving Picture in Picture mode');
    video.removeAttribute(CHROME_PLAYING_PIP_ATTRIBUTE);
    video.dispatchEvent(presentationEvent);
  }, { once: true });
};

/**
 * Adds Picture in Picture event listeners to all video elements
 */
export const addVideoElementListeners = function() {
  const elements = document.getElementsByTagName('video');
  for (let index = 0, element; element = elements[index]; index++) {
    element.addEventListener('enterpictureinpicture', videoDidEnterPictureInPicture);
  }
};
