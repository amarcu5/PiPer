import { getResource } from './common.js'

/**
 * Initialises caching for button, video, and caption elements
 */
export const initialiseCaches = function() {

  // Return a unique id
  let uniqueIdCounter = 0;
  const /** function():string */ uniqueId = function() {
    return 'PiPer_' + uniqueIdCounter++;
  };

  /**
   * Wraps a function that returns an element to provide faster lookups by id
   *
   * @param {function(boolean=):?Element} elementFunction
   * @return {function(boolean=):?Element} 
   */
  const cacheElementWrapper = function(elementFunction) {
    let /** ?string */ cachedElementId = null;

    return /** function():?Element */ function(/** boolean= */ bypassCache) {

      // Return element by id if possible
      const cachedElement = cachedElementId ? 
          document.getElementById(cachedElementId) : null;
      if (cachedElement && !bypassCache) return cachedElement;

      // Call the underlying function to get the element
      const uncachedElement = elementFunction();
      if (uncachedElement) {

        // Save the native id otherwise assign a unique id
        if (!uncachedElement.id) uncachedElement.id = uniqueId();
        cachedElementId = uncachedElement.id;
      }
      return uncachedElement;
    };
  };

  // Wrap the button, video, and caption elements
  const currentResource = getResource();
  currentResource.buttonParent = cacheElementWrapper(currentResource.buttonParent);
  currentResource.videoElement = cacheElementWrapper(currentResource.videoElement);
  if (currentResource.captionElement) {
    currentResource.captionElement = cacheElementWrapper(currentResource.captionElement);
  }
};