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
 *    videoElement: function(): ?Element,
 * }}
 */
let PIPResource;


/** @define {boolean} - Flag used by closure compiler to remove logging */
const COMPILED = false;

const BUTTON_ID = 'PIPButton';

let /** ?Element */ button = null;
let /** ?PIPResource */ currentResource = null;

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
}

/**
 * Tracks injected button
 */
const buttonObserver = function() {

  if (document.getElementById(BUTTON_ID)) return;

  const buttonParent = currentResource.buttonParent();
  if (buttonParent) {
    addButton(buttonParent);
    if (currentResource.buttonDidAppear) currentResource.buttonDidAppear();
    log('Picture in Picture button added to webpage');
  }
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
      const e = document.getElementById('app');
      return e && e.querySelector('div[class^="styles__controls"]');
    },
    buttonScale: 1.1,
    buttonStyle: 'height:22px;width:22px;cursor:pointer;padding:0;border:0;opacity:0.8;margin-right:30px;background:transparent',
    videoElement: function() {
      const e = document.getElementById('app');
      return e && e.querySelector('video[class^="styles__video"]');
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

  const observer = new MutationObserver(buttonObserver);

  observer.observe(document, {
    childList: true,
    subtree: true,
  });

  buttonObserver();
}
