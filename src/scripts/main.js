'use strict';

/**
 * @typedef {{
 *      buttonImage: (string | undefined),
 *      buttonElementType: (string|undefined),
 *      buttonStyle: (string|undefined),
 *      buttonClassName: (string|undefined),
 *      buttonParent: function(): ?Element,
 *      buttonInsertBefore: (function(Element): ?Node|undefined),
 *      videoElement: function(): ?Element,
 *      buttonWillAppear: (function(): undefined|undefined),
 * }}
 */
var PIPResource;


/** @define {boolean} */
const COMPILED = false;

function log(/** string */ message) {
    !COMPILED && console.log("PIPer: " + message);
}


const BUTTON_ID = 'PIPButton';

var /** boolean */      buttonAdded     = false;
var /** ?PIPResource */ currentResource = null;

const addButton = function (/** Element */ parent) {
    const button = document.createElement(currentResource.buttonElementType || 'button');

    button.id = BUTTON_ID;
    button.title = 'Open Picture in Picture mode';
    if (currentResource.buttonStyle)     button.style.cssText = currentResource.buttonStyle;
    if (currentResource.buttonClassName) button.className     = currentResource.buttonClassName;

    const image = document.createElement('img');
    image.src = safari.extension.baseURI + 'images/' + (currentResource.buttonImage || 'default') + '.svg';
    image.style.cssText = 'width:100%;height:100%';

    button.appendChild(image);

    button.addEventListener('click', function (event) {
        event.preventDefault();

        const video = /** @type {?HTMLVideoElement} */ (currentResource.videoElement());
        if (!video) return;

        video.webkitSetPresentationMode('inline' === video.webkitPresentationMode ? 'picture-in-picture' : 'inline');
    });

    parent.insertBefore(button, currentResource.buttonInsertBefore ? currentResource.buttonInsertBefore(parent) : null);
}

const buttonObserver = function () {

    if (buttonAdded) {
        if (document.getElementById(BUTTON_ID)) return;
        log("Button removed");
        buttonAdded = false;
    }

    const buttonParent = currentResource.buttonParent();
    if (buttonParent) {
        if (currentResource.buttonWillAppear) currentResource.buttonWillAppear();
        addButton(buttonParent);
        log("Button added");
        buttonAdded = true;
    }
};

/** @type {!IObject<string, PIPResource>} */
const resources = {
    'amazon': {
        buttonStyle: 'border:0;padding:0;margin:0;background-color:transparent;opacity:0.8;position:relative;left:-8px;width:2vw;height:2vw;min-width:20px;min-height:20px',

        buttonParent: function () {
            const e = document.getElementById('dv-web-player');
            return e && e.querySelector('.hideableTopButtons');
        },

        buttonInsertBefore: function (/** Element */ parent) {
            return parent.lastChild;
        },

        videoElement: function () {
            const e = document.querySelector('.rendererContainer');
            return e && e.querySelector('video[width="100%"]');
        }
    },
    'youtube': {
        buttonStyle: 'transform:scale(0.7)',

        buttonClassName: 'ytp-button',

        buttonParent: function () {
            const e = document.getElementById('movie_player') || document.getElementById('player');
            return e && e.querySelector('.ytp-right-controls');
        },

        videoElement: function () {
            const e = document.getElementById('movie_player') || document.getElementById('player');
            return e && e.querySelector('video.html5-main-video');
        }
    },
    'netflix': {
        buttonImage: 'netflix',

        buttonElementType: 'span',

        buttonStyle: 'position:absolute;right:0;top:0;width:2em;height:100%;cursor:pointer;background-color:#262626',

        buttonParent: function () {
            const e = document.getElementById('playerContainer');
            return e ? e.querySelector('.player-status') : null;
        },

        buttonWillAppear: function () {
            resources['netflix'].buttonParent().style.paddingRight = '50px';
        },

        videoElement: function () {
            const e = document.querySelector('.player-video-wrapper');
            return e && e.querySelector('video');
        }
    },
    'twitch': {
        buttonStyle: 'transform:scale(0.8)',

        buttonClassName: 'player-button',

        buttonParent: function () {
            const e = document.getElementById('video-playback') || document.getElementById('player');
            return e && e.querySelector('.player-buttons-right');
        },

        videoElement: function () {
            const e = document.getElementById('video-playback') || document.getElementById('player');
            return e && e.querySelector('video');
        }
    },
    'metacafe': {
        buttonElementType: 'div',

        buttonStyle: 'transform:scale(0.9);left:-2px',

        buttonParent: function () {
            const e = document.getElementById('player_place');
            return e && e.querySelector('.tray');
        },

        videoElement: function () {
            const e = document.getElementById('player_place');
            return e && e.querySelector('video');
        }
    },
    'openload': {
        buttonStyle: 'transform:scale(0.6);left:5px',

        buttonClassName: 'vjs-control vjs-button',

        buttonInsertBefore: function (/** Element */ parent) {
            return parent.lastChild;
        },

        buttonParent: function () {
            const e = document.getElementById('olvideo');
            return e && e.querySelector('.vjs-control-bar');
        },

        videoElement: function () {
            return document.getElementById('olvideo_html5_api');
        }
    },
    'vevo': {
        buttonStyle: 'transform:scale(0.7);border:0;background:transparent',

        buttonClassName: 'player-control',

        buttonInsertBefore: function (/** Element */ parent) {
            return parent.lastChild;
        },

        buttonParent: function () {
            const e = document.getElementById('control-bar');
            return e && e.querySelector('.right-controls');
        },

        videoElement: function () {
            return document.getElementById('html5-player');
        }
    },
    'collegehumor': {
        buttonStyle: 'transform:scale(0.6)',

        buttonClassName: 'vjs-control vjs-button',

        buttonInsertBefore: function (/** Element */ parent) {
            return parent.lastChild;
        },

        buttonParent: function () {
            const e = document.getElementById('vjs_video_3');
            return e && e.querySelector('.vjs-control-bar');
        },

        videoElement: function () {
            return document.getElementById('vjs_video_3_html5_api');
        }
    },
    'vid': {
        buttonStyle: 'position:relative;left:9px;top:-2px;transform:scale(0.7);padding:0;margin:0',

        buttonInsertBefore: function (/** Element */ parent) {
            return parent.lastChild;
        },

        buttonParent: function () {
            const e = document.getElementById('video_player');
            return e && e.querySelector('.vjs-control-bar');
        },

        videoElement: function () {
            return document.getElementById('video_player_html5_api');
        }
    }
};


const domainName = location.hostname.match(/([^.]+)\.(?:co\.)?[^.]+$/)[1];

if (domainName in resources) {
    log("Matched site " + domainName + " (" + location + ")");
    currentResource = resources[domainName];

    const observer = new MutationObserver(buttonObserver);

    observer.observe(document, {
        childList:true,
        subtree:true
    });

    buttonObserver();
}

