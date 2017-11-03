'use strict';

/**
 * @typedef {{
 *   buttonClassName: (string|undefined),
 *   buttonDidAppear: (function():undefined|undefined),
 *   buttonElementType: (string|undefined),
 *   buttonHoverStyle: (string|undefined),
 *   buttonImage: (string|undefined),
 *   buttonInsertBefore: (function(Element):?Node|undefined),
 *   buttonParent: function(boolean=):?Element,
 *   buttonScale: (number|undefined),
 *   buttonStyle: (string|undefined),
 *   captionElement: (function(boolean=):?Element|undefined),
 *   videoElement: function(boolean=):?Element,
 * }}
 */
let PiperResource;


/** @define {boolean} - Flag used by closure compiler to remove logging */
const COMPILED = false;

const BUTTON_ID = 'PiPer_button';
const TRACK_ID = 'PiPer_track';

let /** ?Element */ button = null;
let /** ?PiperResource */ currentResource = null;
let /** ?TextTrack */ track = null;
let /** boolean */ showingCaptions = false;
let /** string */ lastUnprocessedCaption = '';

/**
 * Logs message to console
 *
 * @param {string} message - Message to log
 */
const log = function(message) {
  !COMPILED && console.log('PiPer: ' + message);
};

/**
 * Injects Picture in Picture button into webpage
 *
 * @param {Element} parent - Element button will be inserted into
 */
const addButton = function(parent) {

  // Create button if needed
  if (!button) {
    button = document.createElement(currentResource.buttonElementType || 'button');

    // Set button properties
    button.id = BUTTON_ID;
    button.title = 'Open Picture in Picture mode';
    if (currentResource.buttonStyle) button.style.cssText = currentResource.buttonStyle;
    if (currentResource.buttonClassName) button.className = currentResource.buttonClassName;

    // Add scaled SVG image to button
    const image = document.createElement('img');
    image.src = safari.extension.baseURI + 'images/' + (currentResource.buttonImage || 'default') + '.svg';
    image.style.width = image.style.height = '100%';
    if (currentResource.buttonScale) image.style.transform = 'scale(' + currentResource.buttonScale + ')';
    button.appendChild(image);

    // Add hover style to button (a nested stylesheet is used to avoid tracking another element)
    if (currentResource.buttonHoverStyle) {
      const style = document.createElement('style');
      const css = '#' + BUTTON_ID + ':hover{' + currentResource.buttonHoverStyle + '}';
      style.appendChild(document.createTextNode(css));
      button.appendChild(style);
    }

    // Toggle Picture in Picture mode when button is clicked
    button.addEventListener('click', function(event) {
      event.preventDefault();

      // Get the video element and bypass caching to accomodate for the underlying video changing (e.g. pre-roll adverts) 
      const video = /** @type {?HTMLVideoElement} */ (currentResource.videoElement(true));
      if (!video) {
        log('Unable to find video');
        return;
      }

      const mode = video.webkitPresentationMode == 'picture-in-picture' ? 'inline' : 'picture-in-picture';
      video.webkitSetPresentationMode(mode);
    });

    log('Picture in Picture button created');
  }

  // Inject button into correct place
  const referenceNode = currentResource.buttonInsertBefore ? currentResource.buttonInsertBefore(parent) : null;
  parent.insertBefore(button, referenceNode);
};

/**
 * Prepares video for captions
 *
 * @param {HTMLVideoElement} video - an unprepared video element
 */
const prepareCaptions = function(video) {

  // Find existing caption track (if video element id changes function can be called twice)
  track = null;
  const allTracks = video.textTracks;
  for (let trackId = allTracks.length; trackId--;) {
    if (allTracks[trackId].label === TRACK_ID) {
      track = allTracks[trackId];
      log('Existing caption track found');
      break;
    }
  }
  if (track) return;

  // Otherwise create new caption track
  log('Caption track created');
  track = video.addTextTrack('captions', TRACK_ID, 'en');

  // Toggle captions when Picture in Picture mode changes
  const toggleCaptions = function() {
    showingCaptions = video.webkitPresentationMode == 'picture-in-picture';
    lastUnprocessedCaption = '';
    processCaptions();
    log('Video presentation mode changed (showingCaptions: ' + showingCaptions + ')');
  };
  video.addEventListener('webkitbeginfullscreen', toggleCaptions);
  video.addEventListener('webkitendfullscreen', toggleCaptions);
};

/**
 * Removes visible Picture in Picture mode captions
 *
 * @param {HTMLVideoElement} video - video element showing captions
 * @param {boolean} workaround - apply Safari bug workaround
 */
const removeCaptions = function(video, workaround = true) {
  track.mode = 'showing';
  while (track.activeCues.length) track.removeCue(track.activeCues[0]);

  // Workaround Safari bug; 'removeCue' doesn't immediately remove captions shown in Picture in Picture mode
  if (workaround) track.addCue(new VTTCue(video.currentTime, video.currentTime + 60, ''));
};

/**
 * Updates visible captions
 */
const processCaptions = function() {

  // Get handles to caption and video elements
  const captionElement = currentResource.captionElement();
  const video = /** @type {?HTMLVideoElement} */ (currentResource.videoElement());

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
        caption += '<i>' + segment + '</i>';
      } else if (style.textDecoration == 'underline') {
        caption += '<u>' + segment + '</u>';
      } else {
        caption += segment;
      }
      caption += ' ';
    } else if (caption.charAt(caption.length - 1) != '\n') {
      caption += '\n';
    }
  }
  caption = caption.trim();
  log('Showing caption "' + caption + '"');
  track.addCue(new VTTCue(video.currentTime, video.currentTime + 60, caption));
};

/**
 * Tracks injected button and captions
 */
const mutationObserver = function() {

  if (showingCaptions && currentResource.captionElement) processCaptions();

  if (document.getElementById(BUTTON_ID)) return;

  const buttonParent = currentResource.buttonParent();
  if (buttonParent) {
    addButton(buttonParent);
    if (currentResource.buttonDidAppear) currentResource.buttonDidAppear();
    log('Picture in Picture button added to webpage');
  }
};

/**
 * Initialises caching for button, video, and caption elements
 */
const initialiseCaches = function() {
  
  // Return a unique id
  let uniqueIdCounter = 0;
  const uniqueId = function() {
    return 'PiPer_' + uniqueIdCounter++;
  };

  // Wraps a function that returns an element to provide faster lookups by id
  const cacheElementWrapper = function(/** (function(): ?Element|undefined) */ elementFunction, elementChangedCallback) {
    let cachedElementId = null;

    return function(bypassCache) {
      
      // Return element by id if possible
      const cachedElement = cachedElementId ? 
          document.getElementById(cachedElementId) : null;
      if (cachedElement && !bypassCache) return cachedElement;
        
      // Call the underlying function to get the element
      const uncachedElement = elementFunction();
      if (uncachedElement) {
        
        // Save the native id otherwise assign a unique id
        if (!uncachedElement.id) uncachedElement.id = uniqueId();
        cachedElementId = uncachedElement.id;
        
        // Call the optional element changed callback if needed
        if (cachedElement != uncachedElement && elementChangedCallback) {
          elementChangedCallback(uncachedElement);
        }
      }
      return uncachedElement;
    };
  };

  // Performance optimisation - prepare captions when new video found
  let videoElementChanged = null;
  if (currentResource.captionElement) {
    currentResource.captionElement = cacheElementWrapper(currentResource.captionElement);
    videoElementChanged = prepareCaptions;
  }
  currentResource.videoElement = cacheElementWrapper(currentResource.videoElement, videoElementChanged);
  currentResource.buttonParent = cacheElementWrapper(currentResource.buttonParent);
};

/**
 * Applies fix to bypass background DOM timer throttling
 */
const bypassBackgroundTimerThrottling = function() {
  const request = new XMLHttpRequest();
  request.open('GET', safari.extension.baseURI + 'scripts/fix.js');
  request.onload = function() {
    const script = document.createElement('script');
    script.appendChild(document.createTextNode(request.responseText));
    button.appendChild(script);
  };
  request.send();
};

/** @type {!IObject<string, PiperResource>} */
const resources = {

  'aktualne': {
    buttonClassName: 'jw-icon jw-icon-inline jw-button-color jw-reset jw-icon-logo',
    buttonElementType: 'div',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      return document.querySelector('.jw-controlbar-right-group');
    },
    buttonStyle: /** CSS */ (`width: 38px`),
    videoElement: function() {
      return document.querySelector('video.jw-video');
    },
  },

  'amazon': {
    buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.querySelector('.fullscreenButtonWrapper');
    },
    buttonParent: function() {
      const e = document.getElementById('dv-web-player');
      return e && e.querySelector('.hideableTopButtons');
    },
    buttonStyle: /** CSS */ (`
      position: relative;
      left: 8px;
      width: 3vw;
      height: 2vw;
      min-width: 35px;
      min-height: 24px;
      border: 0px;
      padding: 0px;
      background-color: transparent;
      opacity: 0.8;
    `),
    captionElement: function() {
      const e = document.getElementById('dv-web-player');
      return e && e.querySelector('.captions');
    },
    videoElement: function() {
      const e = document.querySelector('.rendererContainer');
      return e && e.querySelector('video[width="100%"]');
    },
  },

  'collegehumor': {
    buttonClassName: 'vjs-control vjs-button',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      const e = document.getElementById('vjs_video_3');
      return e && e.querySelector('.vjs-control-bar');
    },
    buttonScale: 0.6,
    buttonStyle: /** CSS */ (`cursor: pointer`),
    videoElement: function() {
      return document.getElementById('vjs_video_3_html5_api');
    },
  },

  'curiositystream': {
    buttonClassName: 'vjs-control vjs-button',
    buttonDidAppear: function() {
      const video = /** @type {?HTMLVideoElement} */ (currentResource.videoElement());
      const videoContainer = video.parentElement;
      video.addEventListener('webkitbeginfullscreen', function() {
        const height = Math.floor(100 * video.videoHeight / video.videoWidth) + 'vw';
        const maxHeight = video.videoHeight + 'px';
        videoContainer.style.setProperty('height', height, 'important');
        videoContainer.style.setProperty('max-height', maxHeight);
      });
      video.addEventListener('webkitendfullscreen', function() {
        videoContainer.style.removeProperty('height');
        videoContainer.style.removeProperty('max-height');
      });
    },
    buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      const e = document.getElementById('main-player');
      return e && e.querySelector('.vjs-control-bar');
    },
    buttonScale: 0.7,
    buttonStyle: /** CSS */ (`
      opacity: 0.8;
      cursor: pointer;
    `),
    videoElement: function() {
      return document.getElementById('main-player_html5_api');
    },
  },

  'eurosportplayer': {
    buttonElementType: 'div',
    buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
    buttonParent: function() {
      return document.querySelector('.video-controls__group-right');
    },
    buttonScale: 0.7,
    buttonStyle: /** CSS */ (`
      height: 100%;
      margin-right: 15px;
      opacity: 0.8;
      cursor: pointer;
    `),
    videoElement: function() {
      return document.querySelector('.video-player__screen');
    },
  },

  'giantbomb': {
    buttonElementType: 'div',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.querySelector('.js-vid-pin-wrap').nextSibling;
    },
    buttonParent: function() {
      return document.querySelector('.av-controls--right');
    },
    buttonScale: 0.7,
    buttonStyle: /** CSS */ (`
      margin-left: 16px;
      height: 100%;
      opacity: 1.0;
      cursor: pointer;
    `),
    videoElement: function() {
      return document.querySelector('video[id^="video_js-vid-player"]');
    }
  },

  'hulu': {
    buttonClassName: 'simple-button',
    buttonDidAppear: function() {
      const buttonParent = currentResource.buttonParent();
      buttonParent.querySelector('.progress-bar-tracker').style.width = 'calc(100% - 380px)';
      buttonParent.querySelector('.progress-time-container').style.marginRight = '45px';
    },
    buttonElementType: 'div',
    buttonHoverStyle: /** CSS */ (`
      filter: brightness(50%) sepia(1) hue-rotate(58deg) saturate(160%) brightness(110%) !important;
    `),
    buttonParent: function() {
      const e = document.getElementById('site-player');
      return e && e.querySelector('.main-bar');
    },
    buttonScale: 0.7,
    buttonStyle: /** CSS */ (`
      top: -45px;
      left: -50px;
      filter: brightness(80%);
    `),
    captionElement: function() {
      return document.querySelector('.closed-caption-container');
    },
    videoElement: function() {
      return document.getElementById('content-video-player');
    },
  },

  'littlethings': {
    buttonClassName: 'jw-icon jw-icon-inline jw-button-color jw-reset jw-icon-logo',
    buttonElementType: 'div',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      return document.querySelector('.jw-controlbar-right-group');
    },
    buttonStyle: /** CSS */ (`width: 38px`),
    videoElement: function() {
      return document.querySelector('video.jw-video');
    },
  },

  'mashable': {
    buttonClassName: 'jw-icon jw-icon-inline jw-button-color jw-reset jw-icon-logo',
    buttonElementType: 'div',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      const e = document.getElementById('player');
      return e && e.querySelector('.jw-controlbar-right-group');
    },
    buttonStyle: /** CSS */ (`
      top: -2px;
      width: 38px;
    `),
    videoElement: function() {
      const e = document.getElementById('player');
      return e && e.querySelector('video.jw-video');
    },
  },

  'metacafe': {
    buttonElementType: 'div',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      const e = document.getElementById('player_place');
      return e && e.querySelector('.tray');
    },
    buttonScale: 0.85,
    videoElement: function() {
      const e = document.getElementById('player_place');
      return e && e.querySelector('video');
    },
  },

  'mixer': {
    buttonClassName: 'control',
    buttonElementType: 'div',
    buttonHoverStyle: /** CSS */ (`background: rgba(255, 255, 255, 0.08)`),
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild.previousSibling;
    },
    buttonParent: function() {
      return document.querySelector('.control-container .toolbar');
    },
    buttonScale: 0.65,
    buttonStyle: /** CSS */ (`
      position: relative;
      top: 2px;
      border-radius: 50%;
      cursor: pointer;
    `),
    videoElement: function() {
      return document.querySelector('.control-container + video');
    },
  },

  'netflix': {
    buttonClassName: 'touchable PlayerControls--control-element nfp-button-control default-control-button',
    buttonHoverStyle: /** CSS */ (`
      filter: brightness(130%);
      transform: scale(1.1);
    `),
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonImage: 'netflix',
    buttonParent: function() {
      return document.querySelector('.PlayerControls--button-control-row'); 
    },
    buttonScale: 0.6,
    buttonStyle: /** CSS */ (`transition: all 0.1s linear`),
    captionElement: function() {
      const e = currentResource.videoElement();
      return e && e.parentElement.querySelector('.player-timedtext');
    },
    videoElement: function() {
      return document.querySelector('.VideoContainer video');
    },
  },

  'ocs': {
    buttonClassName: 'footer-elt fltr',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.querySelector('#togglePlay');
    },
    buttonParent: function() {
      return document.querySelector('.footer-block:last-child');
    },
    buttonScale: 1.2,
    buttonStyle: /** CSS */ (`
      display: block;
      width: 25px;
      height: 18px;
      margin-right: 10px;
      margin-bottom: -10px;
      padding: 0px;
      border: 0px;
      background-color: transparent;
    `),
    videoElement: function() {
      return document.getElementById('LgyVideoPlayer');
    },
  },

  'openload': {
    buttonClassName: 'vjs-control vjs-button',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      const e = document.getElementById('olvideo');
      return e && e.querySelector('.vjs-control-bar');
    },
    buttonScale: 0.6,
    buttonStyle: /** CSS */ (`
      left: 5px;
      cursor: pointer;
    `),
    videoElement: function() {
      return document.getElementById('olvideo_html5_api');
    },
  },

  'plex': {
    buttonDidAppear: function() {
      bypassBackgroundTimerThrottling();
    },
    buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      const e = document.querySelector('div[class^="FullPlayerTopControls-topControls"]');
      return /** @type {?Element} */ (e && e.lastChild);
    },
    buttonScale: 0.6,
    buttonStyle: /** CSS */ (`
      position: relative;
      top: -3px;
      padding: 10px;
      border: 0px;
      background: transparent;
      opacity: 0.7;
      text-shadow: 0px 0px 4px rgba(0, 0, 0, 0.45);
    `),
    captionElement: function() {
      return document.querySelector('.libjass-subs');
    },
    videoElement: function() {
      return document.querySelector('video[class^="VideoContainer-videoElement"]');
    },
  },

  'seznam' : {
    buttonParent: function() {
      return document.querySelector('.sznp-ui-ctrl-panel-layout-wrapper');
    },
    videoElement: function() {
      return document.querySelector('.sznp-ui-tech-video-wrapper video');
    },
  },
 
  'streamable': {
    buttonDidAppear: function() {
      const progressBar = document.getElementById('player-progress');
      const progressBarStyle = window.getComputedStyle(progressBar);
      button.style.right = progressBarStyle.right;
      progressBar.style.right = (parseInt(progressBarStyle.right, 10) + 40) + 'px';
    },
    buttonElementType: 'div',
    buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
    buttonParent: function() {
      return document.querySelector('.player-controls-right');
    },
    buttonStyle: /** CSS */ (`
      position: absolute;
      bottom: 10px;
      height: 26px;
      width: 26px;
      cursor: pointer;
      opacity: 0.9;
      filter: drop-shadow(rgba(0, 0, 0, 0.5) 0px 0px 2px);
    `),
    videoElement: function() {
      return document.getElementById('video-player-tag');
    },
  },
  
  'theonion': {
    buttonClassName: 'jw-icon jw-icon-inline jw-button-color jw-reset jw-icon-logo',
    buttonElementType: 'div',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      const e = document.getElementById('container');
      return e && e.querySelector('.jw-controlbar-right-group');
    },
    buttonStyle: /** CSS */ (`
      top: -2px;
      left: 10px;
      width: 38px;
    `),
    videoElement: function() {
      const e = document.getElementById('container');
      return e && e.querySelector('video.jw-video');
    },
  },

  'twitch': {
    buttonClassName: 'player-button',
    buttonDidAppear: function() {
      const neighbourButton = button.nextSibling;
      const neighbourTooltip = /** @type {HTMLElement} */ (neighbourButton.querySelector('.player-tip'));
      const /** string */ title = button.title;
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
        const video = /** @type {?HTMLVideoElement} */ (currentResource.videoElement());
        if (video) video.webkitSetPresentationMode('inline');
      });
    },
    buttonHoverStyle: /** CSS */ (`
      filter: brightness(50%) sepia(1) hue-rotate(219deg) saturate(117%) brightness(112%);
    `),
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.querySelector('.qa-fullscreen-button');
    },
    buttonParent: function() {
      return document.querySelector('.player-buttons-right');
    },
    buttonScale: 0.8,
    captionElement: function() {
      return document.querySelector('.player-captions-container');
    },
    videoElement: function() {
      return document.querySelector('.player-video video');
    },
  },

  'udemy': {
    buttonClassName: 'vjs-control vjs-button',
    buttonDidAppear: function() {
      document.querySelector('.vjs-fullscreen-control').addEventListener('click', function() {
        const video = /** @type {?HTMLVideoElement} */ (currentResource.videoElement());
        if (video) video.webkitSetPresentationMode('inline');
      });
    },
    buttonParent: function() {
      return document.querySelector('.vjs-control-bar');
    },
    buttonScale: 0.7,
    buttonStyle: /** CSS */ (`order: 7`),
    captionElement: function() {
      const e = currentResource.videoElement();
      return e && e.parentElement.querySelector('.vjs-text-track-display');
    },
    videoElement: function() {
      return document.querySelector('video.vjs-tech');
    },
  },

  'vevo': {
    buttonClassName: 'player-control',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      const e = document.getElementById('control-bar');
      return e && e.querySelector('.right-controls');
    },
    buttonScale: 0.7,
    buttonStyle: /** CSS */ (`
      border: 0px;
      background: transparent;
    `),
    videoElement: function() {
      return document.getElementById('html5-player');
    },
  },

  'vice': {
    buttonClassName: 'vp__controls__icon__popup__container',
    buttonElementType: 'div',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      return document.querySelector('.vp__controls__icons');
    },
    buttonScale: 0.6,
    buttonStyle: /** CSS */ (`top: -11px`),
    videoElement: function() {
      return document.querySelector('video.jw-video');
    },
  },

  'vid': {
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      const e = document.getElementById('video_player');
      return e && e.querySelector('.vjs-control-bar');
    },
    buttonScale: 0.7,
    buttonStyle: /** CSS */ (`
      position: relative;
      top: -2px;
      left: 9px;
      padding: 0px;
      margin: 0px;
    `),
    videoElement: function() {
      return document.getElementById('video_player_html5_api');
    },
  },

  'vrv': {
    buttonClassName: 'vjs-control vjs-button',
    buttonDidAppear: function() {
      const neighbourButton = button.nextSibling;
      neighbourButton.addEventListener('click', function() {
        const video = /** @type {?HTMLVideoElement} */ (currentResource.videoElement());
        if (video) video.webkitSetPresentationMode('inline');
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
      right: calc(50px + 2.5rem);
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
  },

  'youtube': {
    buttonClassName: 'ytp-button',
    buttonDidAppear: function() {
      const neighbourButton = button.previousSibling;
      const /** string */ title = button.title;
      const /** string */ neighbourTitle = neighbourButton.title;
      button.title = '';
      button.addEventListener('mouseover', function() {
        neighbourButton.title = title;
        neighbourButton.dispatchEvent(new Event('mouseover'));
      });
      button.addEventListener('mouseout', function() {
        neighbourButton.dispatchEvent(new Event('mouseout'));
        neighbourButton.title = neighbourTitle;
      });
      bypassBackgroundTimerThrottling();

      // Workaround Safari bug; old captions persist in Picture in Picture mode when MediaSource buffers change
      const video = /** @type {?HTMLVideoElement} */ (currentResource.videoElement());
      const navigateStart = function() {
        showingCaptions = false;
        removeCaptions(video);
      };
      const navigateFinish = function() {
        showingCaptions = video.webkitPresentationMode == 'picture-in-picture';
      };
      window.addEventListener('spfrequest', navigateStart);
      window.addEventListener('spfdone', navigateFinish);
      window.addEventListener('yt-navigate-start', navigateStart);
      window.addEventListener('yt-navigate-finish', navigateFinish);
    },
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      return document.querySelector('.ytp-right-controls');
    },
    buttonScale: 0.68,
    captionElement: function() {
      return document.querySelector('.caption-window');
    },
    videoElement: function() {
      return document.querySelector('video.html5-main-video');
    },
  },
};

// Define domain name aliases and URL shorteners (e.g. youtu.be -> youtube.com)
resources['primevideo'] = resources['amazon'];
resources['stream'] = resources['seznam'];
resources['youtu'] = resources['youtube'];
resources['oload'] = resources['openload'];


// Remove subdomain and public suffix (far from comprehensive as only removes .X and .co.Y)
const domainName = location.hostname && location.hostname.match(/([^.]+)\.(?:co\.)?[^.]+$/)[1];

if (domainName in resources) {
  log('Matched site ' + domainName + ' (' + location + ')');
  currentResource = resources[domainName];

  initialiseCaches();

  const observer = new MutationObserver(mutationObserver);

  observer.observe(document, {
    childList: true,
    subtree: true,
  });

  mutationObserver();
}
