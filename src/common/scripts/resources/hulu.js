import { getResource } from './../common.js'

export const domain = 'hulu';

export const resource = {
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
    return document.querySelector('#site-player .main-bar');
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
};