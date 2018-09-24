import { info, error } from './logger.js'
import { getResource, setResource } from './common.js'
import { videoPlayingPictureInPicture, togglePictureInPicture } from './video.js'
import { getButton, checkButton, addButton } from './button.js'
import { initialiseCaches } from './cache.js'
import { localizedButtonTitle } from './localization.js'

const TRACK_ID = 'PiPer_track';

let /** ?TextTrack */ track = null;
let /** boolean */ showingCaptions = false;
let /** boolean */ showingEmptyCaption = false;
let /** string */ lastUnprocessedCaption = '';

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
 * @param {Event} event - a webkitpresentationmodechanged event
 */
const videoPresentationModeChanged = function(event) {
  
  // Ignore events from other video elements e.g. adverts
  const video =  /** @type {HTMLVideoElement} */ (event.target);
  const expectedVideo = getResource().videoElement(true);
  if (video != expectedVideo) return;
  
  // Toggle display of the captions and prepare video if needed
  showingCaptions = videoPlayingPictureInPicture(video);
  if (showingCaptions) prepareCaptions(video);
  lastUnprocessedCaption = '';
  processCaptions();
  
  info('Video presentation mode changed (showingCaptions: ' + showingCaptions + ')');
};

/**
 * Removes visible Picture in Picture mode captions
 *
 * @param {HTMLVideoElement} video - video element showing captions
 * @param {boolean} workaround - apply Safari bug workaround
 */
const removeCaptions = function(video, workaround = true) {
  while (track.activeCues.length) track.removeCue(track.activeCues[0]);

  // Workaround Safari bug; 'removeCue' doesn't immediately remove captions shown in Picture in Picture mode
  if (workaround && video) {
    track.addCue(new VTTCue(video.currentTime, video.currentTime + 60, ''));
  }
};

/**
 * Updates visible captions
 */
const processCaptions = function() {

  // Get handles to caption and video elements
  const captionElement = getResource().captionElement();
  const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement());

  // Remove Picture in Picture mode captions and show native captions if no longer showing captions or encountered an error
  if (!showingCaptions || !captionElement) {
    removeCaptions(video, !showingEmptyCaption);
    if (captionElement) captionElement.style.visibility = '';
    showingEmptyCaption = true;
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
  info('Showing caption "' + caption + '"');
  track.addCue(new VTTCue(video.currentTime, video.currentTime + 60, caption));
  showingEmptyCaption = false;
};

/**
 * Tracks injected button and captions
 */
const mutationObserver = function() {

  if (showingCaptions && getResource().captionElement) processCaptions();

  // Try adding the button to the page if needed
  if (checkButton()) return;
  const currentResource = getResource();
  const buttonParent = currentResource.buttonParent();
  if (buttonParent) {
    addButton(buttonParent);
    if (currentResource.buttonDidAppear) currentResource.buttonDidAppear();
    info('Picture in Picture button added to webpage');
  }
};

/**
 * Applies fix to bypass background DOM timer throttling
 */
const bypassBackgroundTimerThrottling = function() {
  const request = new XMLHttpRequest();
  request.open('GET', safari.extension.baseURI + 'scripts/fix.js');
  request.onload = function() {
    const script = document.createElement('script');
    script.setAttribute('type', 'module');
    script.appendChild(document.createTextNode(request.responseText));
    document.head.appendChild(script);
  };
  request.send();
};

const resources = {

  'aktualne': {
    buttonClassName: 'jw-icon jw-icon-inline jw-button-color jw-reset jw-icon-logo',
    buttonElementType: 'div',
    buttonHoverStyle: /** CSS */ (`
      filter: brightness(50%) sepia(1) hue-rotate(311deg) saturate(550%) brightness(49%) !important;
    `),
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      return document.querySelector('.jw-controlbar-right-group');
    },
    buttonStyle: /** CSS */ (`
      width: 38px;
      filter: brightness(80%);
    `),
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
      const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement());
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
      return document.querySelector('.controls-bar-right-section');
    },
    buttonScale: 0.9,
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
      const buttonParent = getResource().buttonParent();
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
      return document.querySelector('.control-container .toolbar .right');
    },
    buttonScale: 0.65,
    buttonStyle: /** CSS */ (`
      margin-top: 3px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
    `),
    videoElement: function() {
      return document.querySelector('.control-container + video');
    },
  },

  'mlb': {
    buttonScale: 0.7,
    buttonStyle: /** CSS */ (`
      border: 0px;
      background: transparent;
      filter: brightness(80%);
    `),
    buttonHoverStyle: /** CSS */ (`filter: brightness(120%) !important`),
    buttonParent: function() {
      return document.querySelector('.bottom-controls-right');
    },
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    videoElement: function() {
      return document.querySelector('.mlbtv-media-player video');
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
      const e = getResource().videoElement();
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
      return document.querySelector('.vjs-control-bar');
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
      return document.querySelector('video[class^="HTMLMedia-mediaElement"]');
    },
  },

  'pscp': {
    buttonClassName: 'Pill Pill--withIcon',
    buttonElementType: 'span',
    buttonHoverStyle: /** CSS */ (`
      opacity: 0.8 !important;
      filter: brightness(125%) !important;
    `),
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.querySelector('.ShareBroadcast').nextSibling;
    },
    buttonParent: function() {
      return document.querySelector('.VideoOverlayRedesign-BottomBar-Right');
    },
    buttonScale: 0.6,
    buttonStyle: /** CSS */ (`
      opacity: 0.5;
      filter: brightness(200%);
    `),
    videoElement: function() {
      return document.querySelector('.vjs-tech video[src]');
    },
  },

  'seznam' : {
    buttonClassName: 'sznp-ui-widget-box',
    buttonElementType: 'div',
    buttonHoverStyle: /** CSS */ (`transform: scale(1.05)`),
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      return document.querySelector('.sznp-ui-ctrl-panel-layout-wrapper');
    },
    buttonScale: 0.75,
    buttonStyle: /** CSS */ (`cursor: pointer`),
    videoElement: function() {
      return document.querySelector('.sznp-ui-tech-video-wrapper video');
    },
  },
 
  'streamable': {
    buttonDidAppear: function() {
      const progressBar = document.getElementById('player-progress');
      const progressBarStyle = window.getComputedStyle(progressBar);
      getButton().style.right = progressBarStyle.right;
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

  'ted': {
    buttonClassName: 'z-i:0 pos:r bottom:0 hover/bg:white.7 b-r:.1 p:1 cur:p',
    buttonElementType: 'div',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      const playButton = document.querySelector('[aria-controls="video1"]');
      return playButton.parentElement.parentElement;
    },
    buttonDidAppear: function() {
      const img = getButton().querySelector('img');
      img.classList.add('w:2');
      img.classList.add('h:2');
    },
    videoElement: function() {
      return document.querySelector('video[id^="ted-player-"]');
    }
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
      const button = getButton();
      const neighbourButton = document.querySelector('.qa-fullscreen-button');
      const neighbourTooltip = /** @type {HTMLElement} */ (neighbourButton.querySelector('.player-tip'));
      const title = localizedButtonTitle();
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
        const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement());
        if (video) video.webkitSetPresentationMode('inline');
      });
      neighbourButton.style.order = 2;
    },
    buttonHoverStyle: /** CSS */ (`
      filter: brightness(50%) sepia(1) hue-rotate(219deg) saturate(117%) brightness(112%);
    `),
    buttonParent: function() {
      return document.querySelector('.player-buttons-right');
    },
    buttonScale: 0.8,
    buttonStyle: /** CSS */ (`order: 1`),
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
        const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement());
        if (video) video.webkitSetPresentationMode('inline');
      });
    },
    buttonParent: function() {
      return document.querySelector('.vjs-control-bar');
    },
    buttonScale: 0.7,
    buttonStyle: /** CSS */ (`order: 7`),
    captionElement: function() {
      const e = getResource().videoElement();
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

  'viervijfzes': {
    buttonClassName: 'vjs-control vjs-button',
    buttonDidAppear: function() {
      // Move fullscreen button to the right so the pip button appears left of it
      const fullScreenButton = document.getElementsByClassName("vjs-fullscreen-control")[0];
      fullScreenButton.style.order = 10;
    },
    buttonParent: function() {
      return document.getElementsByClassName("vjs-control-bar")[0];
    },
    buttonStyle: /** CSS */ (`
      text-indent: 0! important;
      margin-left: 10px;
      order: 9;
    `),
    videoElement: function() {
      return document.querySelector('video[preload="metadata"]');
    },
  },

  'vrt': {
    buttonClassName: 'vuplay-control',
    buttonInsertBefore: function(/** Element */ parent) {
      return parent.lastChild;
    },
    buttonParent: function() {
      return document.getElementsByClassName("vuplay-control-right")[0];
    },
    captionElement: function() {
      return document.querySelector('.theoplayer-texttracks');
    },
    buttonStyle: /** CSS */ (`
      width: 30px;
      height: 47px;
      padding: 0;
      position: relative;
      top: -9px;
      right: 8px;
    `),
    videoElement: function() {
      return document.querySelector('video[preload="metadata"]');
    },
  },

  'vrv': {
    buttonClassName: 'vjs-control vjs-button',
    buttonDidAppear: function() {
      const neighbourButton = getButton().nextSibling;
      neighbourButton.addEventListener('click', function() {
        const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement());
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

  'yeloplay': {
    buttonClassName: 'button',
    buttonDidAppear: function() {
      const parent = getResource().buttonParent();
      parent.style.width = "210px";
    },
    buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
    buttonInsertBefore: function(/** Element */ parent) {
      return document.getElementsByTagName("player-fullscreen-button")[0];
    },
    buttonParent: function() {
      return document.getElementsByClassName("buttons")[0];
    },
    buttonScale: 0.8,
    buttonStyle: /** CSS */ (`
      margin-bottom: -10px;
      margin-left: 10px;
      width: 50px;
      cursor: pointer;
      opacity: 0.8;
      height: 40px !important;
      margin-bottom: 0px !important;
    `),
    videoElement: function() {
      return document.querySelector("video[src]");
    },
  },

  'youtube': {
    buttonClassName: 'ytp-button',
    buttonDidAppear: function() {
      const button = getButton();
      const neighbourButton = /** @type {?HTMLElement} */ (button.nextSibling);
      const title = localizedButtonTitle();
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
      const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement());
      const navigateStart = function() {
        showingCaptions = false;
        removeCaptions(video);
      };
      const navigateFinish = function() {
        showingCaptions = videoPlayingPictureInPicture(video);
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
resources['oload'] = resources['openload'];
resources['periscope'] = resources['pscp'];
resources['primevideo'] = resources['amazon'];
resources['stream'] = resources['seznam'];
resources['vier'] = resources['viervijfzes'];
resources['vijf'] = resources['viervijfzes'];
resources['zes'] = resources['viervijfzes'];
resources['youtu'] = resources['youtube'];


// Remove subdomain and public suffix (far from comprehensive as only removes .X and .co.Y)
const domainName = location.hostname && location.hostname.match(/([^.]+)\.(?:co\.)?[^.]+$/)[1];

if (domainName in resources) {
  info('Matched site ' + domainName + ' (' + location + ')');
  setResource(resources[domainName]);

  initialiseCaches();
  
  if (getResource().captionElement) {
    document.addEventListener('webkitpresentationmodechanged', videoPresentationModeChanged, {
      capture: true,
    });
  }

  const observer = new MutationObserver(mutationObserver);
  observer.observe(document, {
    childList: true,
    subtree: true,
  });
  mutationObserver();
}
