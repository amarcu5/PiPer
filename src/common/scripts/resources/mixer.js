export const domain = 'mixer';

export const resource = {
  buttonClassName: 'control',
  buttonElementType: 'div',
  buttonHoverStyle: /** CSS */ (`background: rgba(255, 255, 255, 0.08)`),
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild.previousSibling;
  },
  buttonParent: function() {
    return document.querySelector('.control-container .toolbar .right');
  },
  buttonScale: 0.65,
  buttonStyle: /** CSS */ (`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
  `),
  videoElement: function() {
    return document.querySelector('.control-container + video');
  },
};