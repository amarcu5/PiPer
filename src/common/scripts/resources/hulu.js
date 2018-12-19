import { getButton } from './../button.js'

export const domain = 'hulu';

export const resource = {
  buttonDidAppear: function() {
    
    // Get localized button title and hide default tooltip
    const button = getButton();
    const /** string */ title = button.title;
    button.title = '';
    
    // Create stylized tooltip and add to DOM
    const tooltip = /** @type {HTMLElement} */ (document.createElement('div'));
    tooltip.className = 'button-tool-tips';
    tooltip.style.cssText = /** CSS */ (`
      white-space: nowrap;
      padding: 0 5px;
      right: 0;
    `);
    tooltip.textContent = title.toUpperCase();
    button.appendChild(tooltip);
    
    // Display stylized tooltip on mouseover
    button.addEventListener('mouseover', function() {
      tooltip.style.display = 'block';
    });
    button.addEventListener('mouseout', function() {
      tooltip.style.display = 'none';
    });
  },
  buttonElementType: 'div',
  buttonHoverStyle: /** CSS */ (`opacity: 1.0 !important`),
  buttonInsertBefore: function(/** Element */ parent) {
    return document.querySelector('.controls__view-mode-button');
  },
  buttonParent: function() {
    return document.querySelector('#dash-player-container .controls__menus-right');
  },
  buttonStyle: /** CSS */ (`
    opacity: 0.7;
    cursor: pointer;
    width: 24px;
  `),
  captionElement: function() {
    return document.querySelector('.closed-caption-outband');
  },
  videoElement: function() {
    return document.querySelector('.video-player');
  },
};