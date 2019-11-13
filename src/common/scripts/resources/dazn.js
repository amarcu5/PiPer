export const domain = 'dazn';

export const resource = {
  buttonStyle: (`
    width: 1.5rem;
    height: 1.5rem;
    color: white;
    background: transparent;
    position: relative;
    border: none;
    outline: none;
    border-radius: 0;
    cursor: pointer;
    -webkit-appearance: none;
    margin: 0.5rem;
    z-index: 1;
  `),
  buttonInsertBefore: function(/** Element */ parent) {
  	// The Live indicator might move/cover the PiP button, just place the PiP button before it
  	const liveIndicator = document.querySelector('div[data-test-id^="PLAYER_LIVE_INDICATOR"]');
  	if (liveIndicator) {
      return liveIndicator;
  	}
    return parent.lastChild;
  },
  buttonParent: function() {
    return document.querySelector('div[data-test-id^="PLAYER_BAR"]');	
  },
  videoElement: function() {
    return document.querySelector('div[data-test-id^="PLAYER_SOLUTION"] video');
  }
};


