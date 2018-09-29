import { getResource } from './../common.js'

export const domain = 'yeloplay';

export const resource = {
  buttonClassName: 'button',
  buttonDidAppear: function() {
    const parent = getResource().buttonParent();
    parent.style.width = '210px';
  },
  buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
  buttonInsertBefore: function(/** Element */ parent) {
    return document.getElementsByTagName('player-fullscreen-button')[0];
  },
  buttonParent: function() {
    return document.getElementsByClassName('buttons')[0];
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
    return document.querySelector('video[src]');
  },
};