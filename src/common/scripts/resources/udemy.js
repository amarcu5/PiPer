import { getButton } from './../button.js'

export const domain = 'udemy';

export const resource = {
  buttonClassName: 'btn',
  buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
  buttonInsertBefore: function(/** Element */ parent) {
    return document.querySelector('button[aria-label="Fullscreen"]');
  },
  buttonParent: function() {
    return document.querySelector('div[class^="control-bar--control-bar--"]');
  },
  buttonScale: 0.8,
  buttonStyle: /** CSS */ (`
    width: 3em;
    height: 3em;
    padding: 0;
    opacity: 0.8;
  `),
  captionElement: function() {
    return document.querySelector('div[class^="captions-display--captions-container"]');
  },
  videoElement: function() {
    return document.querySelector('video.vjs-tech');
  },
};