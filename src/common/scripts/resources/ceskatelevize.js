export const domain = 'ceskatelevize';

export const resource = {
  buttonClassName: 'videoButtonShell dontHideControls cursorPointer focusableBtn',
  buttonElementType: 'div',
  buttonHoverStyle: /** CSS */ (`
    filter: brightness(50%) sepia(1) hue-rotate(170deg) saturate(250%) brightness(90%);
  `),
  buttonInsertBefore: function(/** Element */ parent) {
    return document.getElementById('fullScreenShell');
  },
  buttonScale: 1.2,
  buttonStyle: /** CSS */ (`
    width: 18px;
    height: 18px;
    display: inline-block;
  `),
  buttonParent: function() {
    return document.getElementById('videoButtons');
  },
  videoElement: function() {
    return document.getElementById('video');
  },
};