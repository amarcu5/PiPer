export const domain = 'vevo';

export const resource = {
  buttonClassName: 'player-control',
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('#control-bar .right-controls');
  },
  buttonScale: 0.7,
  buttonStyle: /** CSS */ (`
    border: 0px;
    background: transparent;
  `),
  videoElement: function() {
    return document.getElementById('html5-player');
  },
};