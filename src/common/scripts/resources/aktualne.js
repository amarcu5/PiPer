export const domain = 'aktualne';

export const resource = {
  buttonClassName: 'jw-icon jw-icon-inline jw-button-color jw-reset jw-icon-logo',
  buttonElementType: 'div',
  buttonHoverStyle: /** CSS */ (`
    filter: brightness(50%) sepia(1) hue-rotate(311deg) saturate(550%) brightness(49%) !important;
  `),
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('.jw-controlbar-right-group');
  },
  buttonStyle: /** CSS */ (`
    width: 38px;
    filter: brightness(80%);
  `),
  videoElement: function() {
    return document.querySelector('video.jw-video');
  },
};