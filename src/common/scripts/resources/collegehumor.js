export const domain = 'collegehumor';

export const resource = {
  buttonClassName: 'vjs-control vjs-button',
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('.vjs-control-bar');
  },
  buttonScale: 0.6,
  buttonStyle: /** CSS */ (`cursor: pointer`),
  videoElement: function() {
    return document.getElementById('vjs_video_3_html5_api');
  },
};