export const domain = 'metacafe';

export const resource = {
  buttonElementType: 'div',
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('#player_place .tray');
  },
  buttonScale: 0.85,
  videoElement: function() {
    return document.querySelector('#player_place video');
  },
};