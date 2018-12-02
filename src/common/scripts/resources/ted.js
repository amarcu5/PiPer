import { getButton } from './../button.js'

export const domain = 'ted';

export const resource = {
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
};