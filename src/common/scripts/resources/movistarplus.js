export const domain = 'movistarplus';

export const resource = {
  buttonClassName: 'pyr-btn-video eleDown',
  buttonScale: 1,
  // Not a perfect placement, feel free to improve it
  buttonStyle: (`
    color: white;
    background: transparent;
    position: relative;
    border: none;
    outline: none;
    border-radius: 0;
    cursor: pointer;
    -webkit-appearance: none;
    z-index: 1;
    grid-row: 5 / 5;
    grid-column: 18 / 18;
    margin-left: 0.5em;
  `),
  buttonInsertBefore: function(parent) {
    const button = document.querySelector('button[id="pyr-fullsize-button"]').closest('div[class="pyr-btn-video eleDown"]');
    if (button) {
      return button;
    };
    return parent.lastChild;
  },
  buttonParent: function() {
      return document.querySelector('div[id="video-controls"]');	
  },
  videoElement: function() {
    return document.querySelector('div[id="video-player-content"] video');
  }
};
