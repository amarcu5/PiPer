'use strict';

/**
 * @typedef {{
 *    buttonClassName: (string|undefined),
 *    buttonDidAppear: (function(): undefined|undefined),
 *    buttonElementType: (string|undefined),
 *    buttonHoverStyle: (string|undefined),
 *    buttonImage: (string|undefined),
 *    buttonInsertBefore: (function(Element): ?Node|undefined),
 *    buttonParent: function(): ?Element,
 *    buttonScale: (number|undefined),
 *    buttonStyle: (string|undefined),
 *    captionElement: (function(): ?Element|undefined),
 *    videoElement: function(): ?Element,
 * }}
 */
let PIPResource;


/** @define {boolean} - Flag used by closure compiler to remove logging */
const COMPILED = false;

const BUTTON_ID = 'PiPer_button';
const TRACK_ID = 'PiPer_track';

let /** ?Element */ button = null;
let /** ?PIPResource */ currentResource = null;
let /** ?TextTrack */ track = null;
let /** boolean */ showingCaptions = false;
let /** string */ lastUnprocessedCaption = '';

/**
 * Logs message to console
 * @param {string} message - Message to log
 */
const log = function(message) {
  !COMPILED && console.log('PiPer: ' + message);
}

/**
 * Injects Picture in Picture button into webpage
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
  }
  video.addEventListener('webkitbeginfullscreen', toggleCaptions);
  video.addEventListener('webkitendfullscreen', toggleCaptions);
};

/**
 * Updates visible captions
 */
const processCaptions = function() {
  const captionElement = currentResource.captionElement();
  
  // Hide Picture in Picture mode captions and show native captions if no longer showing captions or encountered an error
  if (!showingCaptions || !captionElement) {
    track.mode = 'disabled';
    if (captionElement) captionElement.style.visibility = '';
    return;
  }
  
  // Otherwise ensure native captions remain hidden
  captionElement.style.visibility = 'hidden';
  
  // Check if a new native caption needs to be processed
  const unprocessedCaption = captionElement.textContent;
  if (unprocessedCaption == lastUnprocessedCaption) return;
  lastUnprocessedCaption = unprocessedCaption;

  // Get handle to video (called before accessing 'track' to guarentee valid) 
  const video = /** @type {?HTMLVideoElement} */ (currentResource.videoElement());
  
  // Remove old caption
  track.mode = 'showing';
  if (track.activeCues.length) track.removeCue(track.activeCues[0]);
  
  if (!unprocessedCaption) return;
  
  // Show correctly spaced Picture in Picture mode caption
  let caption = '';
  const walk = document.createTreeWalker(captionElement, NodeFilter.SHOW_TEXT, null, false);
  while (walk.nextNode()) {
    const segment = walk.currentNode.nodeValue.trim();
    caption += segment ? segment + ' ' : '\n';
  }
  log('Showing caption "' + caption.trim() + '"');
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

/** @type {!IObject<string, PIPResource>} */
const resources = {

  'amazon': {
    buttonHoverStyle: 'opacity:1!important',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.querySelector('.fullscreenButtonWrapper');
    },
    buttonParent: function() {
      const e = document.getElementById('dv-web-player');
      return e && e.querySelector('.hideableTopButtons');
    },
    buttonStyle: 'border:0;padding:0;background-color:transparent;opacity:0.8;position:relative;left:8px;width:3vw;height:2vw;min-width:35px;min-height:24px',
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
    videoElement: function() {
      return document.getElementById('vjs_video_3_html5_api');
    },
  },
  
  'curiositystream': {
    buttonHoverStyle: 'opacity:1!important',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      return document.querySelector('div[class^="styles__controls"]');
    },
    buttonScale: 1.1,
    buttonStyle: 'height:22px;width:22px;cursor:pointer;padding:0;border:0;opacity:0.8;margin-right:30px;background:transparent',
    captionElement: function() {
      const e = currentResource.videoElement();
      return /** @type {?Element} */ (e && e.parentNode.querySelector('div:not([class])'));
    },
    videoElement: function() {
      return document.querySelector('video[class^="styles__video"]');
    },
  },

  'hulu': {
    buttonClassName: 'simple-button',
    buttonElementType: 'div',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      const e = document.getElementById('site-player');
      return e && e.querySelector('.main-bar');
    },
    buttonScale: 0.7,
    buttonDidAppear: function() {
      currentResource.buttonParent().querySelector('.progress-bar-tracker').style.width = 'calc(100% - 380px)';
    },
    videoElement: function() {
      return document.getElementById('content-video-player');
    },
  },
  
  'littlethings': {
    buttonClassName: 'jw-icon jw-icon-inline jw-button-color jw-reset jw-icon-logo',
    buttonElementType: 'div',
    buttonParent: function() {
      const e = document.getElementById('player');
      return e && e.querySelector('.jw-controlbar-right-group');
    },
    buttonStyle: 'width:38px',
    videoElement: function() {
      const e = document.getElementById('player');
      return e && e.querySelector('video.jw-video');
    },
  },
  
  'mashable': {
    buttonClassName: 'jw-icon jw-icon-inline jw-button-color jw-reset jw-icon-logo',
    buttonElementType: 'div',
    buttonParent: function() {
      const e = document.getElementById('player');
      return e && e.querySelector('.jw-controlbar-right-group');
    },
    buttonStyle: 'width:38px;top:-2px',
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
  
  'ncaa': {
    buttonClassName: 'video-player-controls-button',
    buttonElementType: 'div',
    buttonParent: function() {
      return document.getElementById('video-player-controls-buttons-right');
    },
    buttonScale: 0.7,
    videoElement: function() {
      return document.getElementById('vjs_video_3_html5_api');
    },  
  },

  'netflix': {
    buttonElementType: 'span',
    buttonImage: 'netflix',
    buttonParent: function() {
      const e = document.getElementById('playerContainer');
      return e ? e.querySelector('.player-status') : null;
    },
    buttonStyle: 'position:absolute;right:0;top:0;width:2em;height:100%;cursor:pointer;background-color:#262626',
    buttonDidAppear: function() {
      currentResource.buttonParent().style.paddingRight = '50px';
    },
    captionElement: function() {
      const e = currentResource.videoElement();
      return /** @type {?Element} */ (e && e.parentNode.querySelector('.player-timedtext'));
    },
    videoElement: function() {
      const e = document.querySelector('.player-video-wrapper');
      return e && e.querySelector('video');
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
    buttonStyle: 'left:5px',
    videoElement: function() {
      return document.getElementById('olvideo_html5_api');
    },
  },
  
  'plex': {
    buttonClassName: 'btn-link',
    buttonHoverStyle: 'opacity:1!important',
    buttonParent: function() {
      const e = document.getElementById('plex');
      return e && e.querySelector('.player-dropups-container.video-controls-right');
    },
    buttonScale: 0.7,
    buttonStyle: 'opacity:0.8;position:relative;top:-3px',
    videoElement: function() {
      return document.getElementById('html-video');
    },
  },
  
  'theonion': {
    buttonClassName: 'jw-icon jw-icon-inline jw-button-color jw-reset jw-icon-logo',
    buttonElementType: 'div',
    buttonParent: function() {
      const e = document.getElementById('container');
      return e && e.querySelector('.jw-controlbar-right-group');
    },
    buttonStyle: 'width:38px;top:-2px',
    videoElement: function() {
      const e = document.getElementById('container');
      return e && e.querySelector('video.jw-video');
    },
  },

  'twitch': {
    buttonClassName: 'player-button',
    buttonDidAppear: function() {
      const button = document.getElementById(BUTTON_ID);
      const neighbourButton = button.nextSibling;
      const neighbourTooltip = /** @type {HTMLElement} */ (neighbourButton.querySelector('.player-tip'));
      const /** string */ title = button.title;
      const /** string */ neighbourTitle = neighbourTooltip.dataset['tip'];
      button.title = '';
      button.addEventListener('mouseover', function(e){
        neighbourTooltip.dataset['tip'] = title;
        neighbourTooltip.style.display = 'block';
      });
      button.addEventListener('mouseout', function(e){
        neighbourTooltip.style.display = '';
        neighbourTooltip.dataset['tip'] = neighbourTitle;
      });
      neighbourButton.addEventListener('click', function(e){
        const video = /** @type {?HTMLVideoElement} */ (currentResource.videoElement());
        if (video) video.webkitSetPresentationMode('inline');
      });
    },
    buttonHoverStyle: 'filter:brightness(50%)sepia(1)hue-rotate(219deg)saturate(117%)brightness(112%)',
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
    buttonStyle: 'border:0;background:transparent',
    videoElement: function() {
      return document.getElementById('html5-player');
    },
  },
  
  'vice': {
    buttonClassName: 'jw-icon jw-icon-inline jw-button-color jw-reset jw-icon-logo',
    buttonElementType: 'div',
    buttonParent: function() {
      const e = document.getElementById('player');
      return e && e.querySelector('.jw-controlbar-right-group');
    },
    buttonStyle: 'width:45px',
    videoElement: function() {
      const e = document.getElementById('player');
      return e && e.querySelector('video.jw-video');
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
    buttonStyle: 'position:relative;left:9px;top:-2px;padding:0;margin:0',
    videoElement: function() {
      return document.getElementById('video_player_html5_api');
    },
  },

  'youtube': {
    buttonClassName: 'ytp-button',
    buttonDidAppear: function() {
      const button = document.getElementById(BUTTON_ID);
      const neighbourButton = button.previousSibling;
      const /** string */ title = button.title;
      const /** string */ neighbourTitle = neighbourButton.title;
      button.title = '';
      button.addEventListener('mouseover', function(e){
        neighbourButton.title = title;
        neighbourButton.dispatchEvent(new Event('mouseover'));
      });
      button.addEventListener('mouseout', function(e){
        neighbourButton.dispatchEvent(new Event('mouseout'));
        neighbourButton.title = neighbourTitle;
      });
    },
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      const e = document.getElementById('movie_player') || document.getElementById('player');
      return e && e.querySelector('.ytp-right-controls');
    },
    buttonScale: 0.68,
    captionElement: function() {
      const e = document.getElementById('movie_player') || document.getElementById('player');
      return e && e.querySelector('.captions-text');      
    },
    videoElement: function() {
      const e = document.getElementById('movie_player') || document.getElementById('player');
      return e && e.querySelector('video.html5-main-video');
    },
  },
};

// Define domain name aliases and URL shorteners (e.g. youtu.be -> youtube.com)
resources['youtu'] = resources['youtube'];


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
