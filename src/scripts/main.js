'use strict';

/**
 * @typedef {{
 *   buttonClassName: (string|undefined),
 *   buttonDidAppear: (function():undefined|undefined),
 *   buttonElementType: (string|undefined),
 *   buttonHoverStyle: (string|undefined),
 *   buttonImage: (string|undefined),
 *   buttonInsertBefore: (function(Element):?Node|undefined),
 *   buttonParent: function():?Element,
 *   buttonScale: (number|undefined),
 *   buttonStyle: (string|undefined),
 *   captionElement: (function():?Element|undefined),
 *   pageLoaded: (function():undefined|undefined),
 *   videoElement: function():?Element,
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

      const video = /** @type {?HTMLVideoElement} */ (currentResource.videoElement());
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
  const cacheElementIds = {};

  // Return element by native id or assign id for faster lookups
  const cacheElementWrapper = function(/** (function(): ?Element|undefined) */ elementFunction, elementChangedCallback) {
    const uniqueLabel = 'PiPer_' + elementFunction.name;
    cacheElementIds[uniqueLabel] = uniqueLabel;

    return function() {
      let element = document.getElementById(cacheElementIds[uniqueLabel]);

      if (!element) {
        element = elementFunction();

        if (element) {
          if (!element.id) element.id = uniqueLabel;
          cacheElementIds[uniqueLabel] = element.id;
          if (elementChangedCallback) elementChangedCallback(element);
        }
      }
      return element;
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

/**
 * Shows alert
 *
 * @param {string} message - a message to display
 * @param {function()} callback - a function called after alert dismissed
 */
const showAlert = function(message, callback) {
  const alert = document.createElement('div');
  alert.style.cssText = /** CSS */ (`
    position: fixed;
    top: 30px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 80px);
    max-width: 600px;
    border-radius: 5px;
    background-color: #E66;
    padding: 10px;
    z-index: 1;
    font-family: -apple-system;
    color: white;
  `);

  const image = document.createElement('img');
  image.src = safari.extension.baseURI + 'images/default.svg';
  image.style.cssText = /** CSS */ (`
    float: left;
    width: 25px;
    height: 25px;
    margin: 5px;
  `);
  alert.appendChild(image);

  const close = document.createElement('div');
  close.innerHTML = '×';
  close.style.cssText = /** CSS */ (`
    float: right;
    width: 25px;
    margin: 0px 5px;
    font-size: 30px;
    text-align: center;
    opacity: 0.6;
    cursor: pointer;
  `);
  alert.appendChild(close);

  const content = document.createElement('div');
  content.innerHTML = '<b style="font-size:18px">PiPer</b></br>' + message;
  content.style.cssText = /** CSS */ (`
    font-size: 16px;
    margin: 0px 45px;
  `);
  alert.appendChild(content);

  close.addEventListener('click', function() {
    document.body.removeChild(alert);
    callback();
  });

  log('Showing alert "' + message + '"');
  document.body.appendChild(alert);
};

/** @type {!IObject<string, PiperResource>} */
const resources = {

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
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild.previousSibling;
    },
    buttonScale: 0.65,
    buttonParent: function() {
      return document.querySelector('.control-container .toolbar');
    },
    buttonStyle: /** CSS */ (`
      position: relative;
      top: 2px;
      cursor: pointer;
    `),
    videoElement: function() {
      return document.querySelector('.control-container + video');
    },
  },

  'netflix': {
    buttonDidAppear: function() {
      currentResource.buttonParent().style.paddingRight = '50px';
    },
    buttonElementType: 'span',
    buttonImage: 'netflix',
    buttonParent: function() {
      const e = document.getElementById('playerContainer');
      return e && e.querySelector('.player-status');
    },
    buttonStyle: /** CSS */ (`
      position: absolute;
      right: 0px;
      top: 0px;
      width: 2em;
      height: 100%;
      background-color: #262626;
      cursor: pointer;
    `),
    captionElement: function() {
      const e = currentResource.videoElement();
      return e && e.parentElement.querySelector('.player-timedtext');
    },
    pageLoaded: function() {
      const path = '/watch';
      if (location.pathname.substr(0, path.length) === path) {
        setTimeout(function() {
          if (button) return;
          if (window.localStorage['netflixTestAlertShown']) return;
          const request = new XMLHttpRequest();
          const testUrl = 'https://www.netflix.com/DoNotTest';
          request.open('GET', testUrl);
          request.onload = function() {
            const parser = new DOMParser();
            const page = parser.parseFromString(request.responseText, 'text/html');
            const value = page.querySelector('.uiToggleSwitch').textContent;
            if (value.trim().toUpperCase() === 'ON') {
              showAlert('Picture in Picture mode isn\'t supported when previewing new Netflix designs. Switch back to the old design <a href="' + testUrl + '" style="text-decoration:underline">here</a>', function() {
                window.localStorage['netflixTestAlertShown'] = true;
              });
            }
          };
          request.send();
        }, 5000);
      }
    },
    videoElement: function() {
      const e = document.querySelector('.player-video-wrapper');
      return e && e.querySelector('video');
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
      return parent.querySelector('.player-button--fullscreen');
    },
    buttonParent: function() {
      const e = document.getElementById('video-playback') || document.getElementById('player');
      return e && e.querySelector('.player-buttons-right');
    },
    buttonScale: 0.8,
    videoElement: function() {
      const e = document.getElementById('video-playback') || document.getElementById('player');
      return e && e.querySelector('video');
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
      window.addEventListener('yt-navigate-start', function() {
        showingCaptions = false;
        removeCaptions(video);
      });
      window.addEventListener('yt-navigate-finish', function() {
        showingCaptions = video.webkitPresentationMode == 'picture-in-picture';
      });
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
resources['youtu'] = resources['youtube'];


// Remove subdomain and public suffix (far from comprehensive as only removes .X and .co.Y)
const domainName = location.hostname && location.hostname.match(/([^.]+)\.(?:co\.)?[^.]+$/)[1];

if (domainName in resources) {
  log('Matched site ' + domainName + ' (' + location + ')');
  currentResource = resources[domainName];

  if (currentResource.pageLoaded) currentResource.pageLoaded();

  initialiseCaches();

  const observer = new MutationObserver(mutationObserver);

  observer.observe(document, {
    childList: true,
    subtree: true,
  });

  mutationObserver();
}
