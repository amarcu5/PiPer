//
//  DonateViewController.swift
//  PiPer
//
//  Created by Adam Marcus on 17/11/2018.
//  Copyright © 2018 Adam Marcus. All rights reserved.
//

import Cocoa

class DonateViewController: NSViewController {
  
  @IBOutlet var totalDonations: NSTextField!
  
  @objc dynamic var donationProducts = [DonationProduct]()

  @IBOutlet var donationTableView: NSTableView!
  @IBOutlet var tableViewHeightConstraint: NSLayoutConstraint!
  @IBOutlet var tableViewWidthConstraint: NSLayoutConstraint!
  
  @IBOutlet var confettiView: ConfettiView!

  func loadProducts(completionHandler: @escaping (_ success: Bool) -> ()) {
    DonationManager.shared.getDonationProducts(completionHandler: {
      productsResponse, error in
      if let products = productsResponse {
        self.donationProducts = products
        completionHandler(true)
      } else {
        completionHandler(false)
      }
    })
  }
  
  override func viewDidLoad() {
    super.viewDidLoad()
    
    self.donationTableView.postsFrameChangedNotifications = true
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(sizeDonationTableViewToFitContents),
      name: NSView.frameDidChangeNotification,
      object: self.donationTableView)
    sizeDonationTableViewToFitContents()
    
    updateTotalDonations()
  }
  
  @objc private func sizeDonationTableViewToFitContents() {
    var computedWidth: CGFloat = 0
    for row in 0..<self.donationTableView.numberOfRows  {
      if let tableCellView = self.donationTableView.view(atColumn: 0, row:row, makeIfNecessary: true) {
        computedWidth = max(computedWidth, tableCellView.fittingSize.width)
      }
    }
    self.tableViewHeightConstraint.constant = self.donationTableView.frame.size.height
    self.tableViewWidthConstraint.constant = computedWidth
    self.donationTableView.tableColumns.first?.width = computedWidth
    self.donationTableView.needsUpdateConstraints = true
  }

  
  func updateTotalDonations() {
    let totalDonations = DonationManager.shared.totalDonations
    if let priceString = DonationManager.shared.localizedStringForPrice(totalDonations),
      let emoticon = DonationManager.shared.emoticonForPrice(totalDonations) {
      self.totalDonations.stringValue = priceString + " " + emoticon
    }
  }
  
  @IBAction func buyClicked(sender: NSButton) {
    let row = self.donationTableView.row(for: sender)
    let donationProduct = self.donationProducts[row]
    DonationManager.shared.buyDonationProduct(donationProduct, completionHandler: {
      transaction in
      
      let state = transaction.transactionState
      if state == .purchased || state == .restored {
        self.confettiView.dropConfetti()
        self.updateTotalDonations()
      }
    })
  }
  
  @IBAction func dismissClicked(sender: NSButton) {
    self.parent?.dismiss(self.parent)
  }
}
