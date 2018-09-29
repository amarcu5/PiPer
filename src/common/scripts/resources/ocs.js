export const domain = 'ocs';

export const resource = {
  buttonClassName: 'footer-elt fltr',
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.querySelector('#togglePlay');
  },
  buttonParent: function() {
    return document.querySelector('.footer-block:last-child');
  },
  buttonScale: 1.2,
  buttonStyle: /** CSS */ (`
    display: block;
    width: 25px;
    height: 18px;
    margin-right: 10px;
    margin-bottom: -10px;
    padding: 0px;
    border: 0px;
    background-color: transparent;
  `),
  videoElement: function() {
    return document.getElementById('LgyVideoPlayer');
  },
};