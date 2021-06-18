export const domain = 'disneyplus';

export const resource = {
  buttonClassName: 'control-icon-btn',
  buttonInsertBefore: function(/** Element */ parent) {
    return document.querySelector('.fullscreen-icon');
  },
  buttonParent: function() {
    return document.querySelector('.controls__right');
  },
  videoElement: function() {
    return document.querySelector('video[src]');
  },
};