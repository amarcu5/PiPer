(function () {
  
  let /** boolean */ upgradeAlertShown = false;

  /**
   * Returns localized legacy upgrade alert message
   *
   * @return {string}
   */
  const localizedUpgradeAlertMessage = function() {
    const language = navigator.language.substring(0, 2);
    switch (language) {
      case 'it':
        return 'Apple finirà presto il supporto per questa versione di PiPer. Esegui l\'upgrade alla versione per [url]Mac App Store[/url] ora';
      case 'es':
        return 'Apple terminará el soporte para esta versión de PiPer pronto. Por favor actualice a la versión de [url]Mac App Store[/url] ahora';
      case 'de':
        return 'Apple wird den Support für diese Version von PiPer in Kürze beenden. Aktualisieren Sie jetzt auf die [url]Mac App Store-Version[/url]';
      case 'nl':
        return 'Apple zal binnenkort de ondersteuning voor deze versie van PiPer beëindigen. Upgrade nu naar de [url]Mac App Store-versie[/url]';
      case 'fr':
        return 'Apple va bientôt mettre fin au support de cette version de PiPer. Veuillez passer à la version [url]Mac App Store[/url] maintenant';
      case 'pt':
        return 'A Apple encerrará o suporte para esta versão do PiPer em breve. Por favor, atualize para a versão [url]Mac App Store[/url] agora';
      case 'en':
      default:
        return 'Apple will end support for this version of PiPer soon. Please upgrade to the [url]Mac App Store version[/url] now';
    }
  };

  /**
   * Shows alert
   *
   * @param {string} message - a message to display
   * @param {function()} callback - a function called after alert dismissed
   */
  const showAlert = function(message, callback) {
    const alert = document.createElement('div');
    alert.style.cssText = /** CSS */ (`
      position: fixed;
      top: 30px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 80px);
      max-width: 600px;
      border-radius: 5px;
      background-color: #E66;
      padding: 10px;
      z-index: 9999;
      font-family: -apple-system;
      line-height: 1.1;
      color: white;
    `);

    const image = /** @type {HTMLImageElement} */ (document.createElement('img'));
    image.src = safari.extension.baseURI + 'images/default.svg';
    image.style.cssText = /** CSS */ (`
      float: left;
      width: 25px;
      height: 25px;
      margin: 5px;
    `);
    alert.appendChild(image);

    const close = document.createElement('div');
    close.innerHTML = '×';
    close.style.cssText = /** CSS */ (`
      float: right;
      width: 25px;
      margin: 0px 5px;
      font-size: 30px;
      text-align: center;
      opacity: 0.6;
      cursor: pointer;
    `);
    alert.appendChild(close);

    const content = document.createElement('div');
    content.innerHTML = `<b style="font-size:18px;font-weight:700">PiPer</b></br>${message}`;
    content.style.cssText = /** CSS */ (`
      font-size: 16px;
      margin: 0px 45px;
    `);
    alert.appendChild(content);

    close.addEventListener('click', function() {
      document.body.removeChild(alert);
      callback();
    });

    document.body.appendChild(alert);
  };

  /**
   * Shows upgrade to Mac App Store alert if needed
   *
   * @param {number} dismissedTimestamp - timestamp upgrade alert was last dismissed in milliseconds
   */
  const showUpgradeAlertIfNeeded = function(dismissedTimestamp) {
    const currentTimestamp = Date.now();

    let /** number */ alertInterval;
    if (currentTimestamp >= 1556665200000) { // 2019-05-01
      alertInterval = 3.6e+6; // hourly
    } else if (currentTimestamp >= 1554073200000) { // 2019-04-01
      alertInterval = 8.64e+7; // daily
    } else if (currentTimestamp >= 1551398400000) { // 2019-03-01
      alertInterval = 6.048e+8; // weekly
    } else {
      alertInterval = 2.628e+9; // monthly
    }

    if (upgradeAlertShown || currentTimestamp - dismissedTimestamp < alertInterval) {
      return;
    }

    const message = localizedUpgradeAlertMessage()
      .replace('[url]', '<a href="https://itunes.apple.com/app/id1421915518?mt=12&ls=1" style="text-decoration:underline;color:white" target="_blank">')
      .replace('[/url]', '</a>');

    showAlert(message, function() {
      safari.self.tab.dispatchMessage('setUpgradeAlertShown', currentTimestamp);
    });

    upgradeAlertShown = true;
  };

  /**
   * Handles Safari 'upgradeAlertShownResponse' messages from global page and shows alert if needed
   *
   * @param {SafariExtensionMessageEvent} messageEvent - a Safari extension message
   */
  const messageHandler = function(/** SafariExtensionMessageEvent */ messageEvent) {
    if (messageEvent.name === 'upgradeAlertShownResponse') {
      safari.self.removeEventListener('message', messageHandler, false);
      const dismissedTimestamp = /** @type {number} */ (messageEvent.message);
      showUpgradeAlertIfNeeded(dismissedTimestamp);
    }
  }

  // Listen for entering Picture in Picture mode events and request last upgrade alert shown time
  document.addEventListener('webkitpresentationmodechanged', function(event){
    const video =  /** @type {HTMLVideoElement} */ (event.target);
    if (video.webkitPresentationMode == 'picture-in-picture') {
      safari.self.addEventListener('message', messageHandler, false);
      safari.self.tab.dispatchMessage('getUpgradeAlertShown');
    }
  }, { capture: true }); 

})();