import { info } from './logger.js'
import { Browser, getBrowser, getResource } from './common.js'

const CHROME_PLAYING_PIP_ATTRIBUTE = 'data-playing-picture-in-picture';

const /** !Array<function(HTMLVideoElement, boolean)> */ eventListeners = [];

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
        // Force enable Picture in Picture mode support
        video.removeAttribute('disablepictureinpicture');
        
        video.requestPictureInPicture();
      }
      break;
    case Browser.UNKNOWN:
    default:
      break;
  }
};

/**
 * Adds a Picture in Picture event listener
 *
 * @param {function(HTMLVideoElement, boolean)} listener - an event listener to add
 */
export const addPictureInPictureEventListener = function(listener) {
  const index = eventListeners.indexOf(listener);
  if (index == -1) {
    eventListeners.push(listener);
  }

  if (getBrowser() == Browser.SAFARI) {
    document.addEventListener('webkitpresentationmodechanged', videoPresentationModeChanged, {
      capture: true,
    });
  }
};

/**
 * Removes a Picture in Picture event listener
 *
 * @param {function(HTMLVideoElement,boolean)} listener - an event listener to remove
 */
export const removePictureInPictureEventListener = function(listener) {
  const index = eventListeners.indexOf(listener);
  if (index > -1) {
    eventListeners.splice(index, 1);
  }
  
  if (getBrowser() == Browser.SAFARI && eventListeners.length == 0) {
    document.removeEventListener('webkitpresentationmodechanged', videoPresentationModeChanged);    
  }
};

/**
 * Dispatches a Picture in Picture event
 *
 * @param {HTMLVideoElement} video - target video element
 */
const dispatchPictureInPictureEvent = function(video) {
  
  // Ignore events from other video elements e.g. adverts
  const expectedVideo = getResource().videoElement(true);
  if (video != expectedVideo) return;

  const isPlayingPictureInPicture = videoPlayingPictureInPicture(video);
  if (isPlayingPictureInPicture) {
    info('Video entering Picture in Picture mode');
  } else {
    info('Video leaving Picture in Picture mode');
  }

  // Call event listeners using a copy to prevent possiblity of endless looping
  const eventListenersCopy = eventListeners.slice();
  for (let listener; listener = eventListenersCopy.pop();) {
    listener(video, isPlayingPictureInPicture);
  }
}

/**
 * Dispatches a Picture in Picture event for every 'webkitpresentationmodechanged' event
 *
 * @param {!Event} event - a webkitpresentationmodechanged event
 */
const videoPresentationModeChanged = function(event) {
  const video =  /** @type {HTMLVideoElement} */ (event.target);
  dispatchPictureInPictureEvent(video);
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
  const video = /** @type {HTMLVideoElement} */ (event.target);

  // Set playing in Picture in Picture mode attribute and dispatch event
  video.setAttribute(CHROME_PLAYING_PIP_ATTRIBUTE, true);
  dispatchPictureInPictureEvent(video);

  // Remove Picture in Picture attribute and dispatch event on leaving Picture in Picture mode
  video.addEventListener('leavepictureinpicture', function(event) {
    video.removeAttribute(CHROME_PLAYING_PIP_ATTRIBUTE);
    dispatchPictureInPictureEvent(video);
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
