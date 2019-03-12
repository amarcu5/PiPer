export const domain = ['periscope', 'pscp'];

export const resource = {
  buttonClassName: 'Pill Pill--withIcon',
  buttonElementType: 'span',
  buttonHoverStyle: /** CSS */ (`
    opacity: 0.8 !important;
    filter: brightness(125%) !important;
  `),
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.querySelector('.ShareBroadcast').nextSibling;
  },
  buttonParent: function() {
    return document.querySelector('.VideoOverlayRedesign-BottomBar-Right');
  },
  buttonScale: 0.6,
  buttonStyle: /** CSS */ (`
    opacity: 0.5;
    filter: brightness(200%);
  `),
  videoElement: function() {
    return document.querySelector('.Video video');
  },
};