chrome.runtime.onInstalled.addListener(function(/** {reason: string} */ details) {
  if (details.reason == "install") {
    chrome.tabs.create({url: chrome.extension.getURL("install.html")});
  }
});