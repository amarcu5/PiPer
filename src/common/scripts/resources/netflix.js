import { getResource } from './../common.js'

export const domain = 'netflix';

export const resource = {
  buttonClassName: 'touchable PlayerControls--control-element nfp-button-control default-control-button',
  buttonHoverStyle: /** CSS */ (`transform: scale(1.2);`),
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('.PlayerControlsNeo__button-control-row'); 
  },
  buttonScale: 0.7,
  buttonStyle: /** CSS */ (`min-width: 2.3em`),
  captionElement: function() {
    const e = getResource().videoElement();
    return e && e.parentElement.querySelector('.player-timedtext');
  },
  videoElement: function() {
    return document.querySelector('.VideoContainer video');
  },
};