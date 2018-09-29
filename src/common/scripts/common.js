import { warn } from './logger.js'

/**
 * @typedef {{
 *   buttonClassName: (string|undefined),
 *   buttonDidAppear: (function():undefined|undefined),
 *   buttonElementType: (string|undefined),
 *   buttonHoverStyle: (string|undefined),
 *   buttonImage: (string|undefined),
 *   buttonInsertBefore: (function(Element):?Node|undefined),
 *   buttonParent: function(boolean=):?Element,
 *   buttonScale: (number|undefined),
 *   buttonStyle: (string|undefined),
 *   captionElement: (function(boolean=):?Element|undefined),
 *   videoElement: function(boolean=):?Element,
 * }}
 */
let PiperResource;

let /** ?PiperResource */ currentResource = null;

/**
 * Returns the current resource
 *
 * @return {?PiperResource}
 */
export const getResource = function() {
  return currentResource;
};

/**
 * Sets the current resource
 *
 * @param {?PiperResource} resource - a resource to set as current resource
 */
export const setResource = function(resource) {
  currentResource = resource;
};

/**
 * Converts a relative path within an extension to a fully-qualified URL
 *
 * @param {string} path - a path to a resource
 * @return {string} 
 */
export const getExtensionURL = function(path) {
  return safari.extension.baseURI + path;
};

/**
 * Applies fix to bypass background DOM timer throttling
 */
export const bypassBackgroundTimerThrottling = function() {

  // Issue warning for unnecessary use of background timer throttling
  if (!currentResource.captionElement) {
    warn('Unnecessary bypassing of background timer throttling on page without caption support');
  }

  const request = new XMLHttpRequest();
  request.open('GET', getExtensionURL('scripts/fix.js'));
  request.onload = function() {
    const script = document.createElement('script');
    script.setAttribute('type', 'module');
    script.appendChild(document.createTextNode(request.responseText));
    document.head.appendChild(script);
  };
  request.send();
};