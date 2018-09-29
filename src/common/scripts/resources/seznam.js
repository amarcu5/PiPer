export const domain = ['seznam', 'stream'];

export const resource = {
  buttonClassName: 'sznp-ui-widget-box',
  buttonElementType: 'div',
  buttonHoverStyle: /** CSS */ (`transform: scale(1.05)`),
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('.sznp-ui-ctrl-panel-layout-wrapper');
  },
  buttonScale: 0.75,
  buttonStyle: /** CSS */ (`cursor: pointer`),
  videoElement: function() {
    return document.querySelector('.sznp-ui-tech-video-wrapper video');
  },
};