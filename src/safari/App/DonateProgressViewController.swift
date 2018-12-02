//
//  DonateProgressViewController.swift
//  PiPer
//
//  Created by Adam Marcus on 19/11/2018.
//  Copyright © 2018 Adam Marcus. All rights reserved.
//

import Cocoa

class DonateProgressViewController: NSViewController {

  @IBOutlet var progressIndicator: NSProgressIndicator!
  @IBOutlet var errorMessage: LocalizedTextField!
  
  override func viewDidLoad() {
    super.viewDidLoad()
    progressIndicator.startAnimation(self)
  }
  
  func showError() {
    progressIndicator.stopAnimation(self)
    errorMessage.isHidden = false
  }

  @IBAction func dismissClicked(sender: NSButton) {
    self.parent?.dismiss(self.parent)
  }
}
