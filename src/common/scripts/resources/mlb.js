export const domain = 'mlb';

export const resource = {
  buttonScale: 0.7,
  buttonStyle: /** CSS */ (`
    border: 0px;
    background: transparent;
    filter: brightness(80%);
  `),
  buttonHoverStyle: /** CSS */ (`filter: brightness(120%) !important`),
  buttonParent: function() {
    return document.querySelector('.bottom-controls-right');
  },
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  videoElement: function() {
    return document.querySelector('.mlbtv-media-player video');
  },
};