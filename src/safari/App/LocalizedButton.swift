//
//  LocalizedButton.swift
//  PiPer
//
//  Created by Adam Marcus on 13/10/2018.
//  Copyright © 2018 Adam Marcus. All rights reserved.
//

import Cocoa

@IBDesignable
class LocalizedButton: NSButton {
  
  override init(frame frameRect: NSRect) {
    super.init(frame: frameRect)
    localizeTitle()
  }
  
  required init?(coder aDecoder: NSCoder) {
    super.init(coder: aDecoder)
    localizeTitle()
  }
  
  override func prepareForInterfaceBuilder() {
    super.prepareForInterfaceBuilder()
    localizeTitle()
  }
  
  func localizeTitle() {
    self.title = LocalizationManager.default.localizedString(forKey:self.title)
  }
  
}
