//
//  ResourceHelper.swift
//  PiPer
//
//  Created by Adam Marcus on 13/10/2018.
//  Copyright © 2018 Adam Marcus. All rights reserved.
//

import Foundation

class ResourceHelper {
  
  static let extensionBundleURL: URL? = {
    guard let pluginURL = Bundle.main.builtInPlugInsURL else {
      return nil
    }
    guard let extensionBundle = Bundle(url: pluginURL.appendingPathComponent("PiPerExt.appex")) else {
      return nil
    }
    return extensionBundle.resourceURL
  }()
  
}
