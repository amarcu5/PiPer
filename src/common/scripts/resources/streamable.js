import { getButton } from './../button.js'

export const domain = 'streamable';

export const resource = {
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
};