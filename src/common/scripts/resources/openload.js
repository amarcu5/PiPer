export const domain = ['openload', 'oload'];

export const resource = {
  buttonClassName: 'vjs-control vjs-button',
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('.vjs-control-bar');
  },
  buttonScale: 0.6,
  buttonStyle: /** CSS */ (`
    left: 5px;
    cursor: pointer;
  `),
  videoElement: function() {
    return document.getElementById('olvideo_html5_api');
  },
};