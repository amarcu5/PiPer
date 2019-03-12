import { info } from './logger.js'
import { localizedString, localizedStringWithReplacements } from './localization.js'

// Hide page during loading
const htmlTag = /** @type {HTMLElement} */ (document.getElementsByTagName("html")[0]);
htmlTag.style.display = 'none';

document.addEventListener('DOMContentLoaded', function() {

  // Localize text elements
  const localizedElements = document.getElementsByClassName('localized-string');
  for (let index = 0, element; element = localizedElements[index]; index++) {
    const key = element.textContent.trim();
    
    let string;
    if (key == 'chrome-flags-warning') {
      string = localizedStringWithReplacements(key, [
        ['emphasis', '<span class="warning-emphasis">'],
        ['/emphasis', '</span>'],
      ]);
    } else {
      string = localizedString(key);
    } 
    
    element.innerHTML = string;
  }

  // Make page visible
  htmlTag.style.removeProperty('display');

  // Open required Chrome flag if warning button clicked
  document.getElementById('warning-button').addEventListener('click', function(event) {
    chrome.tabs.create({url: 'chrome://flags/#enable-surfaces-for-videos'});
  });
  
  // Test for Picture in Picture support and display warning to activate Chrome flags if needed
  const video = /** @type {HTMLVideoElement} */ (document.getElementById('test-video'));
  video.addEventListener('loadeddata', function() {
    video.requestPictureInPicture().catch(function(error) {
      const errorMessage = /** @type {Error} */ (error).message;
      if (~errorMessage.indexOf('Picture-in-Picture is not available')) {
        info('Picture-in-Picture NOT supported');
        document.getElementById('warning').style.display = 'flex';
      } else {
        info('Picture-in-Picture IS supported');
      }
    });
  });
});