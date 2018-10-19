export const domain = 'bbc';

export const resource = {
  buttonParent: function() {
    return null;
  },
  captionElement: function() {
    return document.querySelector('.p_subtitlesContainer');
  },
  videoElement: function() {
    return document.querySelector('#mediaContainer video[src]');
  },
};