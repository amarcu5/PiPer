import { info } from './logger.js'
import { Browser, getBrowser, getResource, setResource } from './common.js'
import { addVideoElementListeners } from './video.js'
import { resources } from './resources/index.js';
import { checkButton, addButton } from './button.js'
import { shouldProcessCaptions, enableCaptions, processCaptions, addVideoCaptionTracks } from './captions.js'
import { initialiseCaches } from './cache.js'

/**
 * Tracks injected button and captions
 */
const mutationObserver = function() {
  const currentResource = getResource();

  // Process video captions if needed
  if (shouldProcessCaptions()) processCaptions();

  // Workaround Chrome's lack of an entering Picture in Picture mode event by monitoring all video elements
  if (getBrowser() == Browser.CHROME) addVideoElementListeners();

  // Workaround Safari bug; captions are not displayed if the track is added after the video has loaded
  if (getBrowser() == Browser.SAFARI && currentResource.captionElement) addVideoCaptionTracks();

  // Try adding the button to the page if needed
  if (checkButton()) return;
  const buttonParent = currentResource.buttonParent();
  if (buttonParent) {
    addButton(buttonParent);
    if (currentResource.buttonDidAppear) currentResource.buttonDidAppear();
    info('Picture in Picture button added to webpage');
  }
};

/**
 * Returns the first non-public subdomain from the current domain name
 *
 * @return {string|undefined}
 */
const getCurrentDomainName = function() {

  // Special case for local Plex Media Server access that always uses port 32400
  if (location.port == 32400) {
    return 'plex';
  } else {
    // Remove subdomain and public suffix (far from comprehensive as only removes .X and .co.Y)
    return (location.hostname.match(/([^.]+)\.(?:com?\.)?[^.]+$/) || [])[1];
  }
};

const domainName = getCurrentDomainName();

if (domainName in resources) {
  info(`Matched site ${domainName} (${location})`);
  setResource(resources[domainName]);

  initialiseCaches();

  if (getBrowser() == Browser.SAFARI) {
    enableCaptions(true);
  }

  const observer = new MutationObserver(mutationObserver);
  observer.observe(document, {
    childList: true,
    subtree: true,
  });
  mutationObserver();
}
