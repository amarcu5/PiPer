import { getResource } from './../common.js'
import { videoPlayingPictureInPicture, togglePictureInPicture } from './../video.js'

export const domain = 'udemy';

export const resource = {
  buttonClassName: 'vjs-control vjs-button',
  buttonDidAppear: function() {
    document.querySelector('.vjs-fullscreen-control').addEventListener('click', function() {
      const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement());
      if (videoPlayingPictureInPicture(video)) togglePictureInPicture(video);
    });
  },
  buttonParent: function() {
    return document.querySelector('.vjs-control-bar');
  },
  buttonScale: 0.7,
  buttonStyle: /** CSS */ (`order: 7`),
  captionElement: function() {
    const e = getResource().videoElement();
    return e && e.parentElement.querySelector('.vjs-text-track-display');
  },
  videoElement: function() {
    return document.querySelector('video.vjs-tech');
  },
};