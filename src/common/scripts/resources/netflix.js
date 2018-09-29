import { getResource } from './../common.js'
import { checkButton } from './../button.js'

export const domain = 'netflix';

export const resource = {
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
};