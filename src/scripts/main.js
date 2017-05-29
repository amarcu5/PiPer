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


/** @define {boolean} */
const COMPILED = false;

function log(/** string */ message) {
  !COMPILED && console.log('PIPer: ' + message);
}


const BUTTON_ID = 'PIPButton';

let /** boolean */ buttonAdded = false;
let /** ?PIPResource */ currentResource = null;

const addButton = function(/** Element */ parent) {
  const button = document.createElement(currentResource.buttonElementType || 'button');

  button.id = BUTTON_ID;
  button.title = 'Open Picture in Picture mode';
  if (currentResource.buttonStyle) button.style.cssText = currentResource.buttonStyle;
  if (currentResource.buttonClassName) button.className = currentResource.buttonClassName;

  const image = document.createElement('img');
  image.src = safari.extension.baseURI + 'images/' + (currentResource.buttonImage || 'default') + '.svg';
  image.style.width = image.style.height = '100%';
  if (currentResource.buttonScale) image.style.transform = 'scale(' + currentResource.buttonScale + ')';
  button.appendChild(image);

  if (currentResource.buttonHoverStyle) {
    const style = document.createElement('style');
    const css = '#' + BUTTON_ID + ':hover{' + currentResource.buttonHoverStyle + '}';
    style.appendChild(document.createTextNode(css));
    button.appendChild(style);
  }

  button.addEventListener('click', function(event) {
    event.preventDefault();

    const video = /** @type {?HTMLVideoElement} */ (currentResource.videoElement());
    if (!video) {
      log('Unable to find video');
      return;
    }

    const presentationMode = 'inline' === video.webkitPresentationMode ? 'picture-in-picture' : 'inline';
    video.webkitSetPresentationMode(presentationMode);
  });

  const referenceNode = currentResource.buttonInsertBefore ? currentResource.buttonInsertBefore(parent) : null;
  parent.insertBefore(button, referenceNode);
}

const buttonObserver = function() {

  if (buttonAdded) {
    if (document.getElementById(BUTTON_ID)) return;
    log('Button removed');
    buttonAdded = false;
  }

  const buttonParent = currentResource.buttonParent();
  if (buttonParent) {
    addButton(buttonParent);
    if (currentResource.buttonDidAppear) currentResource.buttonDidAppear();
    log('Button added');
    buttonAdded = true;
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
      resources['hulu'].buttonParent().querySelector('.progress-bar-tracker').style.width = 'calc(100% - 380px)';
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
      resources['netflix'].buttonParent().style.paddingRight = '50px';
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
      const neighbourTooltip = /** @type {HTMLElement} */ (button.nextSibling.querySelector('.player-tip'));
      const /** string */ previousTitle = neighbourTooltip.dataset['tip'];
      button.addEventListener('mouseover', function(e){
        neighbourTooltip.dataset['tip'] = button.title;
        neighbourTooltip.style.display = 'block';
        button.title = '';
      });
      button.addEventListener('mouseout', function(e){
        neighbourTooltip.style.display = '';
        button.title = neighbourTooltip.dataset['tip'];
        neighbourTooltip.dataset['tip'] = previousTitle;
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
      const neighbourButton = button.nextSibling;
      const /** string */ previousTitle = neighbourButton.title;
      button.addEventListener('mouseover', function(e){
        neighbourButton.title = button.title;
        button.title = '';
        neighbourButton.dispatchEvent(new Event('mouseover'));
      });
      button.addEventListener('mouseout', function(e){
        neighbourButton.dispatchEvent(new Event('mouseout'));
        button.title = neighbourButton.title;
        neighbourButton.title = previousTitle;
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

resources['youtu'] = resources['youtube'];


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
