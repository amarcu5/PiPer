import { info } from './logger.js'

/**
 * Toggles video Picture in Picture
 *
 * @param {HTMLVideoElement} video - video element to toggle Picture in Picture mode
 */
export const togglePictureInPicture = function(video) {
  const playingPictureInPicture = videoPlayingPictureInPicture(video);
  if (playingPictureInPicture) {
  	video.webkitSetPresentationMode('inline');
  } else {
    video.webkitSetPresentationMode('picture-in-picture');
  }
};

/**
 * Returns true if video is playing Picture in Picture
 *
 * @param {HTMLVideoElement} video - video element to test
 * @return {boolean} 
 */
export const videoPlayingPictureInPicture = function(video) {
  return video.webkitPresentationMode == 'picture-in-picture';
};
