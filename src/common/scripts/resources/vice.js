export const domain = 'vice';

export const resource = {
  buttonClassName: 'vp__controls__icon__popup__container',
  buttonElementType: 'div',
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('.vp__controls__icons');
  },
  buttonScale: 0.6,
  buttonStyle: /** CSS */ (`top: -11px`),
  videoElement: function() {
    return document.querySelector('video.jw-video');
  },
};