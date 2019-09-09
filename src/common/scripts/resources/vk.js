export const domain = 'vk';

export const resource = {
  buttonClassName: 'videoplayer_btn',
  buttonElementType: 'div',
  buttonInsertBefore: function(/** Element */ parent) {
    return document.querySelector('div.videoplayer_btn_fullscreen');
  },
  buttonStyle: /** CSS */ (`
    width: 24px;
    height: 45px;
    padding: 0 8px;
  `),
  buttonParent: function() {
    return document.querySelector('div.videoplayer_controls');
  },
  videoElement: function() {
    return document.querySelector('video.videoplayer_media_provider');
  },
};