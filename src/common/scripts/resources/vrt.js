export const domain = 'vrt';

export const resource = {
  buttonClassName: 'vuplay-control',
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.getElementsByClassName('vuplay-control-right')[0];
  },
  captionElement: function() {
    return document.querySelector('.theoplayer-texttracks');
  },
  buttonStyle: /** CSS */ (`
    width: 30px;
    height: 47px;
    padding: 0;
    position: relative;
    top: -9px;
    right: 8px;
  `),
  videoElement: function() {
    return document.querySelector('video[preload="metadata"]');
  },
};