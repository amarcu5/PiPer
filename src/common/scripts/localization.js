import { error } from './logger.js'

const localizations = {};

localizations['button-title'] = {
  'en': 'Open Picture in Picture mode',
  'de': 'Bild-in-Bild starten',
  'nl': 'Beeld in beeld starten',
  'fr': 'Démarrer Image dans l’image',
  'tr': 'Resim içinde Resim modunu aç',
};

localizations['donate'] = {
  'en': 'Donate',
  'de': 'Spenden',
  'tr': 'Bağış Yap',
};

localizations['donate-small'] = {
  'en': 'Small donation',
  'tr': 'Küçük bağış',
};

localizations['donate-medium'] = {
  'en': 'Medium donation',
  'tr': 'Orta bağış',
};

localizations['donate-large'] = {
  'en': 'Grand donation',
  'tr': 'Büyük bağış',
};

localizations['total-donations'] = {
  'en': 'Total donations:',
  'tr': 'Toplam bağış:',
};

localizations['donate-error'] = {
  'en': 'In-app purchase unavailable',
  'tr': 'Uygulama içi satın alım hatası',
};

localizations['report-bug'] = {
  'en': 'Report a bug',
  'de': 'Einen Fehler melden',
  'tr': 'Bir hata bildir',
};

localizations['options'] = {
  'en': 'Options',
  'tr': 'Seçenekler',
};

localizations['install-thanks'] = {
  'en': 'Thanks for adding PiPer!',
  'tr': 'Piper kullandığınız için teşekkürler!',
};

localizations['enable'] = {
  'en': 'Enable',
  'tr': 'Etkinleştir',
};

localizations['safari-disabled-warning'] = {
  'en': 'Extension is currently disabled, enable in Safari preferences',
  'tr': 'Eklenti şu anda devre dışı, Safari tercihlerinde etkinleştirin',
};

localizations['chrome-flags-open'] = {
  'en': 'Open Chrome Flags',
  'tr': 'Chrome Flags aç',
};

localizations['chrome-flags-warning'] = {
  'en': 'Before you get started you need to enable the chrome flag [emphasis]"SurfaceLayer objects for videos"[/emphasis]',
  'tr': 'Başlamadan önce Chrome flag emphasis]"SurfaceLayer objects for videos"[/emphasis] etkinleştirmeniz gerekli',
};

// Set English as the default fallback language
const defaultLanguage = 'en';

/**
 * Returns a localized version of the string designated by the specified key
 *
 * @param {string} key - the key for a string 
 * @param {string=} language - two-letter ISO 639-1 language code
 * @return {string}
 */
export const localizedString = function(key, language = navigator.language.substring(0, 2)) {
  
  // Get all localizations for key
  const /** Object<string,string> */ localizationsForKey = localizations[key];
  if (localizationsForKey) {
    
    // Get the users specific localization or fallback to default language
    let string = localizationsForKey[language] || localizationsForKey[defaultLanguage];
    if (string) return string;
  }
  
  error(`No localized string found for key '${key}'`);
  return '';
};

/**
 * Returns a localized version of the string designated by the specified key with tags replaced
 *
 * @param {string} key - the key for a string 
 * @param {Array<Array<string>>} replacements - an array of arrays containing pairs of tags and their replacement
 * @param {string=} language - two-letter ISO 639-1 language code
 * @return {string}
 */
export const localizedStringWithReplacements = function(key, replacements, language) {
  
  let string = localizedString(key, language);
  
  // Replace tags of the form [XXX] with directed replacements if needed
  for (let index = replacements.length; index--; ) {
    let replacement = replacements[index];
    
    // Ensure tags do not contain special characters (this gets optimised away as opposed to escaping the tags with the associated performance cost)
    if (/[^-_0-9a-zA-Z\/]/.test(replacement[0])) {
      error(`Invalid characters used in localized string tag '${replacement[0]}'`);
    }
    
    const regex = new RegExp(`\\\[${replacement[0]}\\\]`, 'g');
    string = string.replace(regex, replacement[1]);
  }

  return string;
};
