import { info } from './logger.js'
import { videoPlayingPictureInPicture } from './video.js'

let activeVideo = null;
let timeoutId = 0;
let /** !Object<string, Array> */ timeouts = {};

const /** !Array<number> */ requests = [];
const /** !Array<function(number): undefined> */ callbacks = [];

const originalSetTimeout = window.setTimeout;
const originalClearTimeout = window.clearTimeout;
const originalRequestAnimationFrame = window.requestAnimationFrame;

/**
 * Tracks animation frame requests and forwards requests when page visible
 *
 * @param {function(number): undefined} callback - a requestAnimationFrame callback
 */
const trackAnimationFrameRequest = function(callback) {
  let request = 0;

  if (!activeVideo) {
    request = originalRequestAnimationFrame(callback);
    requests.push(request);
  }

  callbacks.push(callback);

  return request;
};
window.requestAnimationFrame = trackAnimationFrameRequest;

/**
 * Clears tracked animation frame requests on new frame
 */
const clearAnimationFrameRequests = function() {
  requests.length = 0;
  callbacks.length = 0;

  originalRequestAnimationFrame(clearAnimationFrameRequests);
};
clearAnimationFrameRequests();

/**
 * Calls tracked animation frame requests and timeouts
 */
const callAnimationFrameRequestsAndTimeouts = function() {
  
  // Copy animation frame callbacks before calling to prevent endless looping
  const callbacksCopy = callbacks.slice();
  callbacks.length = 0;

  // Call animation frame requests
  const timestamp = window.performance.now();
  for (let callback; callback = callbacksCopy.pop();) {
    callback(timestamp);
  }

  // Copy timeouts to prevent endless looping
  const timeoutsCopy = timeouts;
  timeouts = {};
  
  // Call elapsed timeouts
  for (let id in timeoutsCopy) {
    let timeout = timeoutsCopy[id];
    if (timeout[0] <= timestamp) {
      if (typeof timeout[1] == "function") {
        timeout[1]();
      } else {
        eval(/** @type {string} */ (timeout[1]));
      }
    } else {
      timeouts[id] = timeout;
    }
  }
};

/**
 * Avoids background throttling by invoking timeouts with media 'timeupdate' events
 *
 * @param {Function|TrustedScript|string} callback - a setTimeout callback
 * @param {number=} timeout - a delay in ms
 * @return {number}
 */
const unthrottledSetTimeout = function(callback, timeout) {
  const id = timeoutId++;
  timeouts[id.toString()] = [window.performance.now() + (timeout || 0), callback];
  return id;
};

/**
 * Clears queued timeouts to be invoked with media 'timeupdate' events
 *
 * @param {?number|undefined} id - an id returned by unthrottledSetTimeout
 */
const unthrottledClearTimeout = function(id) {
  if (id) delete timeouts[id.toString()];
};

/**
 * Bypasses background timer throttling when video playing picture in picture
 */
const bypassBackgroundTimerThrottling = function() {

  if (document.hidden) {

    const allVideos = document.querySelectorAll('video');
    for (let videoId = allVideos.length; videoId--;) {
      const video = /** @type {?HTMLVideoElement} */ (allVideos[videoId]);
      if (videoPlayingPictureInPicture(video)) {
        activeVideo = video;
        break;
      }
    }
    if (!activeVideo) return;
    
    for (let request; request = requests.pop();) {
      window.cancelAnimationFrame(request);
    }

    window.setTimeout = unthrottledSetTimeout;
    window.clearTimeout = unthrottledClearTimeout;
    
    activeVideo.addEventListener('timeupdate', callAnimationFrameRequestsAndTimeouts);

    info('Bypassing background timer throttling');

  } else if (activeVideo) {

    info('Finished bypassing background timer throttling');

    window.setTimeout = originalSetTimeout;
    window.clearTimeout = originalClearTimeout;

    activeVideo.removeEventListener('timeupdate', callAnimationFrameRequestsAndTimeouts);

    activeVideo = null;

    for (let callbackId = callbacks.length; callbackId--;) {
      let request = originalRequestAnimationFrame(callbacks[callbackId]);
      requests.push(request);
    }

    const timestamp = window.performance.now();
    for (let id in timeouts) {
      let timeout = timeouts[id];
      originalSetTimeout(timeout[1], timeout[0] - timestamp);
    }
    timeouts = {};
  }
};
document.addEventListener('visibilitychange', bypassBackgroundTimerThrottling);