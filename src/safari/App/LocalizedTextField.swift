//
//  LocalizedTextField.swift
//  PiPer
//
//  Created by Adam Marcus on 13/10/2018.
//  Copyright © 2018 Adam Marcus. All rights reserved.
//

import Cocoa

@IBDesignable
class LocalizedTextField: NSTextField {
  
  override init(frame frameRect: NSRect) {
    super.init(frame: frameRect)
    localizeValue()
  }
  
  required init?(coder aDecoder: NSCoder) {
    super.init(coder: aDecoder)
    localizeValue()
  }
  
  override func prepareForInterfaceBuilder() {
    super.prepareForInterfaceBuilder()
    localizeValue()
  }
  
  func localizeValue() {
    self.stringValue = LocalizationManager.default.localizedString(forKey:self.stringValue)
  }

}
