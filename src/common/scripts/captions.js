import { info } from './logger.js'
import { Browser, getBrowser, getResource } from './common.js'
import { videoPlayingPictureInPicture, addPictureInPictureEventListener, removePictureInPictureEventListener } from './video.js'

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
  removePictureInPictureEventListener(pictureInPictureEventListener);

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
  addPictureInPictureEventListener(pictureInPictureEventListener);
  
  info('Closed caption support enabled');

  if (ignoreNowPlayingCheck) return;

  const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement(true));
  if (!video) return;
  showingCaptions = videoPlayingPictureInPicture(video);
  track = getCaptionTrack(video);
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
 * Gets caption track for video (creates or returns existing track as needed)
 *
 * @param {HTMLVideoElement} video - video element that will display captions
 * @return {TextTrack}
 */
const getCaptionTrack = function(video) {

  // Find existing caption track
  const allTracks = video.textTracks;
  for (let trackId = allTracks.length; trackId--;) {
    if (allTracks[trackId].label === TRACK_ID) {
      info('Existing caption track found');
      return allTracks[trackId];
    }
  }

  // Otherwise create new caption track
  info('Caption track created');
  return video.addTextTrack('captions', TRACK_ID, 'en');
};

/**
 * Adds caption tracks to all video elements
 */
export const addVideoCaptionTracks = function() {
  const elements = document.getElementsByTagName('video');
  for (let index = 0, element; element = elements[index]; index++) {
    getCaptionTrack(/** @type {?HTMLVideoElement} */ (element));
  }
};

/**
 * Toggles captions when video enters or exits Picture in Picture mode
 *
 * @param {HTMLVideoElement} video - target video element
 * @param {boolean} isPlayingPictureInPicture - true if video playing Picture in Picture
 */
const pictureInPictureEventListener = function(video, isPlayingPictureInPicture) {
  
  // Toggle display of the captions and prepare video if needed
  showingCaptions = isPlayingPictureInPicture;
  if (showingCaptions) {
    track = getCaptionTrack(video);
    track.mode = 'showing';
  }
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
  track.mode = 'showing';
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