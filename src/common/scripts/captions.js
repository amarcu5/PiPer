import { info } from './logger.js'
import { Browser, getBrowser, getResource } from './common.js'
import { videoPlayingPictureInPicture } from './video.js'

const TRACK_ID = 'PiPer_track';

let /** ?TextTrack */ track = null;
let /** boolean */ captionsEnabled = false;
let /** boolean */ showingCaptions = false;
let /** boolean */ showingEmptyCaption = false;
let /** string */ lastUnprocessedCaption = '';

/**
 * Disable closed caption support in Picture in Picture mode
 */
export const disableCaptions = function() {
  captionsEnabled = false;
  showingCaptions = false;
  processCaptions();
  document.removeEventListener('webkitpresentationmodechanged', videoPresentationModeChanged);

  info('Closed caption support disabled');
};

/**
 * Enable closed caption support in Picture in Picture mode
 *
 * @param {boolean=} ignoreNowPlayingCheck - assumes video isn't already playing Picture in Picture
 */
export const enableCaptions = function(ignoreNowPlayingCheck) {  

  if (!getResource().captionElement) return;

  captionsEnabled = true;
  document.addEventListener('webkitpresentationmodechanged', videoPresentationModeChanged, {
    capture: true,
  });

  info('Closed caption support enabled');

  if (ignoreNowPlayingCheck) return;

  const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement(true));
  if (!video) return;
  showingCaptions = videoPlayingPictureInPicture(video);
  prepareCaptions(video);
  processCaptions();
};

/**
 * Checks whether processing closed captions is required
 *
 * @return {boolean}
 */
export const shouldProcessCaptions = function() {
  return captionsEnabled && showingCaptions;
};

/**
 * Prepares video for captions
 *
 * @param {HTMLVideoElement} video - video element that will display captions
 */
const prepareCaptions = function(video) {

  // Find existing caption track
  track = null;
  const allTracks = video.textTracks;
  for (let trackId = allTracks.length; trackId--;) {
    if (allTracks[trackId].label === TRACK_ID) {
      track = allTracks[trackId];
      info('Existing caption track found');
      break;
    }
  }
  if (track) return;

  // Otherwise create new caption track
  info('Caption track created');
  track = video.addTextTrack('captions', TRACK_ID, 'en');
  track.mode = 'showing';
};

/**
 * Toggles captions when video presentation mode changes
 *
 * @param {!Event} event - a webkitpresentationmodechanged event
 */
export const videoPresentationModeChanged = function(event) {

  if (!captionsEnabled) return;
  
  // Ignore events from other video elements e.g. adverts
  const video =  /** @type {HTMLVideoElement} */ (event.target);
  const expectedVideo = getResource().videoElement(true);
  if (video != expectedVideo) return;

  // Toggle display of the captions and prepare video if needed
  showingCaptions = videoPlayingPictureInPicture(video);
  if (showingCaptions) prepareCaptions(video);
  lastUnprocessedCaption = '';
  processCaptions();

  info(`Video presentation mode changed (showingCaptions: ${showingCaptions})`);
};

/**
 * Removes visible Picture in Picture mode captions
 *
 * @param {HTMLVideoElement} video - video element showing captions
 * @param {boolean=} workaround - apply Safari bug workaround
 */
const removeCaptions = function(video, workaround = true) {

  while (track.activeCues.length) {
    track.removeCue(track.activeCues[0]);
  }

  // Workaround Safari bug; 'removeCue' doesn't immediately remove captions shown in Picture in Picture mode
  if (getBrowser() == Browser.SAFARI && workaround && video && !showingEmptyCaption) {
    track.addCue(new VTTCue(video.currentTime, video.currentTime + 60, ''));
    showingEmptyCaption = true;
  }
};

/**
 * Displays Picture in Picture mode caption
 *
 * @param {HTMLVideoElement} video - video element showing captions
 * @param {string} caption - a caption to display
 */
const addCaption = function(video, caption) {

  info(`Showing caption '${caption}'`);
  track.addCue(new VTTCue(video.currentTime, video.currentTime + 60, caption));

  if (getBrowser() == Browser.SAFARI) {
    showingEmptyCaption = false;
  }
};

/**
 * Updates visible captions
 */
export const processCaptions = function() {

  // Get handles to caption and video elements
  const captionElement = getResource().captionElement();
  const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement());
  
  // Remove Picture in Picture mode captions and show native captions if no longer showing captions or encountered an error
  if (!showingCaptions || !captionElement) {
    removeCaptions(video);
    if (captionElement) captionElement.style.visibility = '';
    return;
  }

  // Otherwise ensure native captions remain hidden
  captionElement.style.visibility = 'hidden';

  // Check if a new native caption needs to be processed
  const unprocessedCaption = captionElement.textContent;
  if (unprocessedCaption == lastUnprocessedCaption) return;
  lastUnprocessedCaption = unprocessedCaption;
  
  // Remove old captions and apply Safari bug fix if caption has no content as otherwise causes flicker
  removeCaptions(video, !unprocessedCaption);

  // Performance optimisation - early exit if caption has no content
  if (!unprocessedCaption) return;

  // Show correctly spaced and formatted Picture in Picture mode caption
  let caption = '';
  const walk = document.createTreeWalker(captionElement, NodeFilter.SHOW_TEXT, null, false);
  while (walk.nextNode()) {
    const segment = walk.currentNode.nodeValue.trim();
    if (segment) {
      const style = window.getComputedStyle(walk.currentNode.parentElement);
      if (style.fontStyle == 'italic') {
        caption += `<i>${segment}</i>`;
      } else if (style.textDecoration == 'underline') {
        caption += `<u>${segment}</u>`;
      } else {
        caption += segment;
      }
      caption += ' ';
    } else if (caption.charAt(caption.length - 1) != '\n') {
      caption += '\n';
    }
  }
  caption = caption.trim();
  addCaption(video, caption);
};