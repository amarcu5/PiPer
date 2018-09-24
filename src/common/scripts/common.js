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
