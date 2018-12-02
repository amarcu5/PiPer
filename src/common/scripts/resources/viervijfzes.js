import { getButton } from './../button.js'

export const domain = ['vijf', 'vier', 'zes'];

export const resource = {
  buttonClassName: 'vjs-control vjs-button',
  buttonDidAppear: function() {
    // Move fullscreen button to the right so the pip button appears left of it
    const fullScreenButton = document.getElementsByClassName('vjs-fullscreen-control')[0];
    fullScreenButton.style.order = 10;
  },
  buttonParent: function() {
    return document.getElementsByClassName('vjs-control-bar')[0];
  },
  buttonStyle: /** CSS */ (`
    text-indent: 0! important;
    margin-left: 10px;
    order: 9;
  `),
  videoElement: function() {
    return document.querySelector('video[preload="metadata"]');
  },
};