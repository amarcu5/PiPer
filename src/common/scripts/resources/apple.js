export const domain = 'apple';

/**
 * Returns nested shadow root
 *
 * @param {!Array<string>} selectors
 * @return {?ShadowRoot}
 */
const getNestedShadowRoot = function(selectors) {
  let dom = document;
  for (const selector of selectors) {
    dom = /** @type {HTMLElement} */ (dom.querySelector(selector));
    dom = dom && dom.shadowRoot;
    if (!dom) return null;
  }
  return /** @type {ShadowRoot} */ (dom);
}

export const resource = {
  buttonClassName: 'footer__control hydrated',
  buttonElementType: 'div',
  buttonHoverStyle: /** CSS */ (`opacity: 0.8 !important`),
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    const internal = getNestedShadowRoot(["apple-tv-plus-player", 
                                          "amp-video-player-internal"]);
    if (!internal) return;
    const fullscreenButton = internal.querySelector("amp-playback-controls-full-screen");
    if (!fullscreenButton) return;
    return fullscreenButton.parentElement;
  },
  buttonStyle: /** CSS */ (`
    transition: opacity 0.15s;
    cursor: pointer;
    opacity: 0.9;
  `),
  videoElement: function() {
    const video = getNestedShadowRoot(["apple-tv-plus-player", 
                                       "amp-video-player-internal", 
                                       "amp-video-player"]);
    if (!video) return;
    return video.querySelector('video');
  },
};