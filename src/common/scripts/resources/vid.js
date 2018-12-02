export const domain = 'vid';

export const resource = {
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('.vjs-control-bar');
  },
  buttonScale: 0.7,
  buttonStyle: /** CSS */ (`
    position: relative;
    top: -2px;
    left: 9px;
    padding: 0px;
    margin: 0px;
  `),
  videoElement: function() {
    return document.getElementById('video_player_html5_api');
  },
};