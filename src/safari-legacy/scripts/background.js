const messageHandler = function(/** SafariExtensionMessageEvent */ messageEvent) {
  switch (messageEvent.name) {
    case 'getUpgradeAlertShown':
      const setting = /** @type {string|undefined} */ (safari.extension.settings['upgradeAlertShown']);
      const target = /** @type {SafariBrowserTab} */ (messageEvent.target);
      target.page.dispatchMessage('upgradeAlertShownResponse', parseInt(setting || '0', 10));
      break;
    case 'setUpgradeAlertShown':
      safari.extension.settings['upgradeAlertShown'] = messageEvent.message;
      break;
  }
}
safari.application.addEventListener('message', messageHandler, false);
