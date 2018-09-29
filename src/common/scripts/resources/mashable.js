export const domain = 'mashable';

export const resource = {
  buttonClassName: 'jw-icon jw-icon-inline jw-button-color jw-reset jw-icon-logo',
  buttonElementType: 'div',
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('.jw-controlbar-right-group');
  },
  buttonStyle: /** CSS */ (`
    top: -2px;
    width: 38px;
  `),
  videoElement: function() {
    return document.querySelector('video.jw-video');
  },
};