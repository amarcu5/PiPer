(function() {
  'use strict';

  let activeVideo = null;
  let timeoutId = 0;

  const requests = [];
  const callbacks = [];
  const timeouts = [];

  const originalRequestAnimationFrame = window.requestAnimationFrame;
  const originalSetTimeout = window.setTimeout;

  /**
   * Tracks animation frame requests and forwards requests when page visible
   */
  const trackAnimationFrameRequest = function(callback) {
    let request = 0;

    if (!document.hidden) {
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
    const callbacksCopy = callbacks.slice();
    callbacks.length = 0;

    const timestamp = window.performance.now();
    for (let callback; callback = callbacksCopy.pop();) {
      callback(timestamp);
    };

    const timeoutsCopy = timeouts.slice();
    timeouts.length = 0;

    for (let timeout; timeout = timeoutsCopy.pop();) {
      timeout();
    };
  };

  /**
   * Avoids background throttling by invoking small timeouts with media 'timeupdate' events
   *
   * @param {Function|string} callback
   * @param {number=} timeout
   * @return {number}
   */
  const unthrottledSetTimeout = function(callback, timeout) {
    if (timeout >= 500) return originalSetTimeout(callback, timeout);

    timeouts.push(callback);

    return timeoutId++;
  };

  /**
   * Bypasses background timer throttling when video playing picture in picture
   */
  const bypassBackgroundTimerThrottling = function() {
    if (document.hidden) {

      const allVideos = document.querySelectorAll('video');
      for (let videoId = allVideos.length; videoId--;) {
        const video = /** @type {?HTMLVideoElement} */ (allVideos[videoId]);
        if (video.webkitPresentationMode == 'picture-in-picture') {
          activeVideo = video;
          break;
        }
      }
      if (!activeVideo) return;

      for (let request; request = requests.pop();) {
        window.cancelAnimationFrame(request);
      }

      window.setTimeout = unthrottledSetTimeout;
      activeVideo.addEventListener('timeupdate', callAnimationFrameRequestsAndTimeouts);

    } else if (activeVideo) {

      for (let callbackId = callbacks.length; callbackId--;) {
        let request = originalRequestAnimationFrame(callbacks[callbackId]);
        requests.push(request);
      }

      window.setTimeout = originalSetTimeout;
      activeVideo.removeEventListener('timeupdate', callAnimationFrameRequestsAndTimeouts);

      for (let timeout; timeout = timeouts.pop();) {
        timeout();
      };

      activeVideo = null;
    }
  };
  document.addEventListener('visibilitychange', bypassBackgroundTimerThrottling);

})();
