export const domain = 'ustream';

export const resource = {
  buttonClassName: 'component shown',
  buttonElementType: 'div',
  buttonHoverStyle: /** CSS */ (`
    opacity: 1 !important;
    filter: drop-shadow(0px 0px 5px rgba(255, 255, 255, 0.5));
  `),
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonScale: 0.8,
  buttonStyle: /** CSS */ (`
    opacity: 0.7;
  `),
  buttonParent: function() {
    return document.getElementById('controlPanelRight');
  },
  videoElement: function() {
    return document.querySelector('#ViewerContainer video');
  },
};