import { getButton } from './../button.js'

export const domain = 'espn';

export const resource = {
  buttonClassName: 'media-icon',
  buttonDidAppear: function() {
    // Get localized button title and hide default tooltip
    const button = getButton();
    const /** string */ title = button.title;
    button.title = '';

    // Create stylized tooltip and add to DOM
    const tooltip = /** @type {HTMLElement} */ (document.createElement('div'));
    tooltip.className = 'control-tooltip';
    tooltip.style.cssText = /** CSS */ (`
      right: 0px;
      bottom: 35px;
      transition: bottom 0.2s ease-out;
    `);
    tooltip.textContent = title;
    button.appendChild(tooltip);

    // Display stylized tooltip on mouseover
    button.addEventListener('mouseover', function() {
      button.classList.add('displaying');
      tooltip.style.bottom = '75px';
    });
    button.addEventListener('mouseout', function() {
      button.classList.remove('displaying');
      tooltip.style.bottom = '35px';
    });
  },
  buttonElementType: 'div',
  buttonInsertBefore: function(/** Element */ parent) {
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('.controls-right-horizontal');
  },
  buttonScale: 0.7,
  buttonStyle: /** CSS */ (`
    width: 44px;
    height: 44px;
    order: 4;
  `),
  captionElement: function() {
    return document.querySelector('.text-track-display');
  },
  videoElement: function() {
    return document.querySelector('video.js-video-content');
  },
};