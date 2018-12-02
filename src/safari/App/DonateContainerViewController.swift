//
//  DonateContainerViewController.swift
//  PiPer
//
//  Created by Adam Marcus on 19/11/2018.
//  Copyright © 2018 Adam Marcus. All rights reserved.
//

import Cocoa

class DonateContainerViewController: NSTabViewController {
  
  @IBOutlet var donateProgressViewTabItem: NSTabViewItem!
  @IBOutlet var donateViewTabItem: NSTabViewItem!
  
  override func viewDidLoad() {
    super.viewDidLoad()
    
    let donateViewController = donateViewTabItem.viewController as! DonateViewController
    let donateProgressViewController = donateProgressViewTabItem.viewController as! DonateProgressViewController
    
    let productsAvaliable = DonationManager.shared.donationProductsAvaliable()
    
    donateViewController.loadProducts(completionHandler: {
      success in
      if !success {
        donateProgressViewController.showError()
      } else if !productsAvaliable {
        self.tabView.selectTabViewItem(self.donateViewTabItem)
      }
    })
    
    if productsAvaliable {
      self.tabView.selectTabViewItem(self.donateViewTabItem)
    }
  }
  
  override func tabView(_ tabView: NSTabView, didSelect tabViewItem: NSTabViewItem?) {
    super.tabView(tabView, didSelect: tabViewItem)
    
    if let window = self.view.window, let contentSize = tabViewItem?.view?.fittingSize {
      let newWindowSize = window.frameRect(forContentRect: NSRect(origin: CGPoint.zero, size: contentSize)).size
      
      var frame = window.frame
      frame.origin.x = frame.origin.x + (frame.size.width - newWindowSize.width) * 0.5
      frame.origin.y = frame.origin.y + (frame.size.height - newWindowSize.height)
      frame.size = newWindowSize
      
      window.animator().setFrame(frame, display: false)
    }
  }

}
