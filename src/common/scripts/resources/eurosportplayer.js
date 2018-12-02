export const domain = 'eurosportplayer';

export const resource = {
  buttonElementType: 'div',
  buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
  buttonParent: function() {
    return document.querySelector('.controls-bar-right-section');
  },
  buttonScale: 0.9,
  buttonStyle: /** CSS */ (`
    height: 100%;
    margin-right: 15px;
    opacity: 0.8;
    cursor: pointer;
  `),
  videoElement: function() {
    return document.querySelector('.video-player__screen');
  },
};