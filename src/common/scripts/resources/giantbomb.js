export const domain = 'giantbomb';

export const resource = {
  buttonElementType: 'div',
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.querySelector('.js-vid-pin-wrap').nextSibling;
  },
  buttonParent: function() {
    return document.querySelector('.av-controls--right');
  },
  buttonScale: 0.7,
  buttonStyle: /** CSS */ (`
    margin-left: 16px;
    height: 100%;
    opacity: 1.0;
    cursor: pointer;
  `),
  videoElement: function() {
    return document.querySelector('video[id^="video_js-vid-player"]');
  }
};