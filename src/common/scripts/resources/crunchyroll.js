export const domain = 'crunchyroll';

export const resource = {
  buttonClassName: 'vjs-control vjs-button',
  buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
  buttonScale: 0.6,
  buttonStyle: /** CSS */ (`
    position: absolute;
    right: 100px;
    opacity: 0.75;
    cursor: pointer;
  `),
  buttonParent: function() {
    return document.querySelector('.vjs-control-bar');
  },
  videoElement: function() {
    return document.getElementById('player_html5_api');
  },
};