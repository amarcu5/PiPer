export const domain = ['amazon', 'primevideo'];

export const resource = {
  buttonHoverStyle: /** CSS */ (`opacity: 1 !important`),
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.querySelector('.fullscreenButtonWrapper');
  },
  buttonParent: function() {
    const e = document.getElementById('dv-web-player');
    return e && e.querySelector('.hideableTopButtons');
  },
  buttonStyle: /** CSS */ (`
    position: relative;
    left: 8px;
    width: 3vw;
    height: 2vw;
    min-width: 35px;
    min-height: 24px;
    border: 0px;
    padding: 0px;
    background-color: transparent;
    opacity: 0.8;
  `),
  captionElement: function() {
    const e = document.getElementById('dv-web-player');
    return e && e.querySelector('.captions');
  },
  videoElement: function() {
    const e = document.querySelector('.rendererContainer');
    return e && e.querySelector('video[width="100%"]');
  },
};