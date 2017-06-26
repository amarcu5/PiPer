(function() {
  'use strict';
  
  let activeVideo = null;
  let timeoutId = 0;

  const timeoutMessageName = 'PiPer_message';
  const timeouts = [];

  const requests = [];
  const callbacks = [];
  
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
   * Calls tracked animation frame requests
   */
  const callAnimationFrameRequests = function() {
    const callbacksCopy = callbacks.slice();
    callbacks.length = 0;
    
    const timestamp = window.performance.now();
    for (let callback; callback = callbacksCopy.pop();) {
       callback(timestamp);
    };
  };
  
  /**
   * Receives and calls timeouts from the message queue
   */
  const handleTimeoutMessages = function(event) {
    if (event.data != timeoutMessageName) return;
    event.stopPropagation();
    
    if (timeouts.length) timeouts.shift()();
  };
  window.addEventListener('message', handleTimeoutMessages, true);
  
  /**
   * Avoids background throttling by invoking small timeouts instantly using a message queue
   * @param {Function|string} callback
   * @param {number=} timeout
   * @return {number}
   */
  const unthrottledSetTimeout = function(callback, timeout) {
    if (timeout >= 500) return originalSetTimeout(callback, timeout);
    
    timeouts.push(callback);
    window.postMessage(timeoutMessageName, location.href);
    
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
      activeVideo.addEventListener('timeupdate', callAnimationFrameRequests);
      
    } else if (activeVideo) {
      
      for (let callbackId = callbacks.length; callbackId--;) {
         let request = originalRequestAnimationFrame(callbacks[callbackId]);
         requests.push(request);
      }
      
      window.setTimeout = originalSetTimeout;
      activeVideo.removeEventListener('timeupdate', callAnimationFrameRequests);
      
      activeVideo = null;
    }
  };
  document.addEventListener('visibilitychange', bypassBackgroundTimerThrottling);
  
})();