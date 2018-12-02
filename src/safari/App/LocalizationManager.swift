//
//  LocalizationManager.swift
//  PiPer
//
//  Created by Adam Marcus on 12/10/2018.
//  Copyright © 2018 Adam Marcus. All rights reserved.
//

import Foundation
import JavaScriptCore

class LocalizationManager {
  
  let context: JSContext = JSContext()
  let languageCode: String

  static let `default` = LocalizationManager()
  
  init(withLanguageCode languageCode: String? = Locale.current.languageCode) {
    
    self.languageCode = languageCode ?? ""
    
    #if DEBUG
    context.exceptionHandler = { _, value in
      print("Localization JavaScriptCore error: \(value!)")
    }
    #endif
    
    context.evaluateScript("const window = {};")
    
    if let extensionBundleURL = ResourceHelper.extensionBundleURL {
      let localizationFile = extensionBundleURL.appendingPathComponent("scripts/localization-bridge.js").path

      let localizationFileContents = try? String(contentsOfFile: localizationFile,
                                                 encoding: String.Encoding.utf8)
      
      if let localizationScript = localizationFileContents {
        context.evaluateScript(localizationScript)
      }
    }
  }

  func localizedString(forKey key: String) -> String {
    let string = context.evaluateScript("window.localizedString('\(key)', '\(languageCode)');").toString()
    return string ?? ""
  }
  
}

