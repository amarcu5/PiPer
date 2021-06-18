export const domain = 'motogp';

export const resource = {
  buttonStyle: (`
    width: 3em;
    height: 3em;
    color: white;
    background: transparent;
    position: relative;
    border: none;
    outline: none;
    border-radius: 0;
    cursor: pointer;
    -webkit-appearance: none;
    z-index: 1;
  `),
  buttonHoverStyle: (`
    background: radial-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01), rgba(255, 255, 255, 0)) !important;
  `),
  buttonInsertBefore: function(/** Element */ parent) {
    const fullScreenButton = document.querySelector('.vjs-fullscreen-control');
    if (fullScreenButton) {
      return fullScreenButton;
    }
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('.vjs-control-bar');	
  },
  videoElement: function() {
    return document.querySelector('video[class="vjs-tech"]');
  }
};
