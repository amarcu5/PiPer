export const domain = 'fubo';

export const resource = {
  buttonElementType: 'div',
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('.css-ja7yk7');
  },
  buttonScale: 1.25,
  buttonStyle: /** CSS */ (`
    height: 24px;
    width: 25px;
    margin: 8px 10px 12px;
    cursor: pointer;
  `),
  videoElement: function() {
    return document.getElementById('bitmovinplayer-video-video');
  },
};