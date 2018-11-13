import { info, error } from './logger.js'
import { getResource, getExtensionURL } from './common.js'
import { togglePictureInPicture, addPictureInPictureEventListener } from './video.js'
import { localizedString } from './localization.js'

const BUTTON_ID = 'PiPer_button';

let /** ?HTMLElement */ button = null;

/**
 * Injects Picture in Picture button into webpage
 *
 * @param {Element} parent - Element button will be inserted into
 */
export const addButton = function(parent) {

  // Create button if needed
  if (!button) {
    const buttonElementType = getResource().buttonElementType || 'button';
    button = /** @type {HTMLElement} */ (document.createElement(buttonElementType));

    // Set button properties
    button.id = BUTTON_ID;
    button.title = localizedString('button-title');
    const buttonStyle = getResource().buttonStyle;
    if (buttonStyle) button.style.cssText = buttonStyle;
    const buttonClassName = getResource().buttonClassName;
    if (buttonClassName) button.className = buttonClassName;

    // Add scaled image to button
    const image = /** @type {HTMLImageElement} */ (document.createElement('img'));
    image.style.width = image.style.height = '100%';
    const buttonScale = getResource().buttonScale;
    if (buttonScale) image.style.transform = `scale(${buttonScale})`;
    button.appendChild(image);

    // Set image paths
    let buttonImage = getResource().buttonImage;
    let buttonExitImage = getResource().buttonExitImage;
    if (!buttonImage) {
      buttonImage = 'default';
      buttonExitImage = 'default-exit';
    }
    const buttonImageURL = getExtensionURL(`images/${buttonImage}.svg`);
    image.src = buttonImageURL;
    if (buttonExitImage) {
      const buttonExitImageURL = getExtensionURL(`images/${buttonExitImage}.svg`);
      addPictureInPictureEventListener(function(video, isPlayingPictureInPicture) {
        image.src = (isPlayingPictureInPicture) ? buttonExitImageURL : buttonImageURL;
      });
    }

    // Add hover style to button (a nested stylesheet is used to avoid tracking another element)
    const buttonHoverStyle = getResource().buttonHoverStyle;
    if (buttonHoverStyle) {
      const style = document.createElement('style');
      const css = `#${BUTTON_ID}:hover{${buttonHoverStyle}}`;
      style.appendChild(document.createTextNode(css));
      button.appendChild(style);
    }

    // Toggle Picture in Picture mode when button is clicked
    button.addEventListener('click', function(event) {
      event.preventDefault();

      // Get the video element and bypass caching to accomodate for the underlying video changing (e.g. pre-roll adverts) 
      const video = /** @type {?HTMLVideoElement} */ (getResource().videoElement(true));
      if (!video) {
        error('Unable to find video');
        return;
      }

      togglePictureInPicture(video);
    });

    info('Picture in Picture button created');
  }

  // Inject button into correct place
  const referenceNode = getResource().buttonInsertBefore ? getResource().buttonInsertBefore(parent) : null;
  parent.insertBefore(button, referenceNode);
};

/**
 * Returns the Picture in Picture button element
 *
 * @return {?HTMLElement}
 */
export const getButton = function() {
  return button;
};

/**
 * Checks if Picture in Picture button is injected into page
 *
 * @return {boolean}
 */
export const checkButton = function() {
  return !!document.getElementById(BUTTON_ID);
};
