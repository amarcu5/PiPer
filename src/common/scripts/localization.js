/**
 * Returns localized button title
 *
 * @return {string}
 */
export const localizedButtonTitle = function() {
  const language = navigator.language.substring(0, 2);
  switch (language) {
    case 'de':
      return 'Bild-in-Bild starten';
    case 'nl':
      return 'Beeld in beeld starten';
    case 'fr':
      return 'Démarrer Image dans l’image';
    case 'en':
    default:
      return 'Open Picture in Picture mode';
  }
};