import { info } from './logger.js'
import { getResource, setResource } from './common.js'
import { addVideoElementListeners } from './video.js'
import { resources } from './resources/index.js';
import { checkButton, addButton } from './button.js'
import { shouldProcessCaptions, enableCaptions, processCaptions } from './captions.js'
import { initialiseCaches } from './cache.js'

/**
 * Tracks injected button and captions
 */
const mutationObserver = function() {

  // Process video captions if needed
  if (shouldProcessCaptions()) processCaptions();
  
  // Try adding the button to the page if needed
  if (checkButton()) return;
  const currentResource = getResource();
  const buttonParent = currentResource.buttonParent();
  if (buttonParent) {
    addButton(buttonParent);
    if (currentResource.buttonDidAppear) currentResource.buttonDidAppear();
    info('Picture in Picture button added to webpage');
  }
};

// Remove subdomain and public suffix (far from comprehensive as only removes .X and .co.Y)
const domainName = location.hostname && location.hostname.match(/([^.]+)\.(?:co\.)?[^.]+$/)[1];

if (domainName in resources) {
  info('Matched site ' + domainName + ' (' + location + ')');
  setResource(resources[domainName]);

  initialiseCaches();
  
  enableCaptions(true);

  const observer = new MutationObserver(mutationObserver);
  observer.observe(document, {
    childList: true,
    subtree: true,
  });
  mutationObserver();
}
