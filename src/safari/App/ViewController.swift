//
//  ViewController.swift
//  PiPer App
//
//  Created by Adam Marcus on 19/07/2018.
//  Copyright © 2018 Adam Marcus. All rights reserved.
//

import Cocoa
import SafariServices

class ViewController: NSViewController {
  
  let extensionId = String(cString:EXTENSION_BUNDLE_ID)
  
  @IBOutlet var viewContainer: NSVisualEffectView!
  @IBOutlet var mainView: NSView!
  @IBOutlet var extensionDisabledView: NSView!
  
  
  override func viewDidLoad() {
    super.viewDidLoad()
    
    // Display the main view by default
    viewContainer.addSubview(mainView)
    
    // Poll every second for Safari extension state changes
    Timer.scheduledTimer(timeInterval: 1.0, target: self, selector: #selector(ViewController.checkExtensionState), userInfo: nil, repeats: true).fire()
  }
  
  // Display the requested view
  func showView(_ newView: NSView) {
    let oldView = viewContainer.subviews.first
    if oldView == newView {
      return
    }
    // Avoid animating the transition due to NSButton vibrancy rendering glitch in dark mode
    // viewContainer.animator().replaceSubview(oldView!, with:newView)
    viewContainer.replaceSubview(oldView!, with:newView)
  }
  
  // Check extension state and show extension disabled view if necessary
  @objc func checkExtensionState() {
    SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionId) { state, error in
      DispatchQueue.main.async {
        if let status = state?.isEnabled {
          self.showView(status ? self.mainView : self.extensionDisabledView)
        }
      }
    }
  }
  
  @IBAction func clickedEnableExtension(sender: NSButton) {
    SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionId)
  }
  
  @IBAction func clickedReportBug(sender: NSButton) {
    if let url = URL(string: "https://github.com/amarcu5/PiPer/issues") {
      NSWorkspace.shared.open(url)
    }
  }

}
