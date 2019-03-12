import { getResource } from './../common.js'

export const domain = '9now';

export const resource = {
  buttonClassName: 'vjs-control vjs-button',
  buttonHoverStyle: /** CSS */ (`
    filter: brightness(50%) sepia(1) hue-rotate(167deg) saturate(253%) brightness(104%);
  `),
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.querySelector('.vjs-fullscreen-control');
  },
  buttonParent: function() {
    return document.querySelector('.vjs-control-bar');
  },
  buttonScale: 0.7,
  buttonStyle: /** CSS */ (`
    order: 999999;
    cursor: pointer;
    height: 44px;
    width: 40px;
  `),
  captionElement: function() {
    const e = getResource().videoElement();
    return e && e.parentElement.querySelector('.vjs-text-track-display');
  },
  videoElement: function() {
    return document.querySelector('video.vjs-tech');
  },
};