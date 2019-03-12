//
//  DonationManager.swift
//  PiPer
//
//  Created by Adam Marcus on 21/11/2018.
//  Copyright © 2018 Adam Marcus. All rights reserved.
//

import Cocoa
import StoreKit


class DonationProduct : NSObject {
  @objc let name: String
  @objc let price: String
  @objc let emoticon: String
  
  fileprivate let product: SKProduct
  
  fileprivate init(name: String, price: String, emoticon: String, product: SKProduct) {
    self.name = name
    self.price = price
    self.emoticon = emoticon
    self.product = product
    super.init()
  }
}

class DonationManager {

  public typealias GetDonationProductsCompletionHandler = (_ products: [DonationProduct]?, _ error: Error?) -> ()
  public typealias BuyDonationProductCompletionHandler = (_ transaction: SKPaymentTransaction) -> ()
  
  static let shared = DonationManager()
  
  static private let identifiers = Set([
    "com.amarcus.PiPer.donation.1",
    "com.amarcus.PiPer.donation.3",
    "com.amarcus.PiPer.donation.10"
  ])
  
  static private let totalDonationsKey = "com.amarcus.PiPer.totalDonations"

  private var donationProducts:[DonationProduct]?
  
  private var smallestDonation: NSDecimalNumber?
  private var priceFormatter: NumberFormatter?
  
  private init() {}
  
  func getDonationProducts(completionHandler: @escaping GetDonationProductsCompletionHandler = {_,_ in}) {
    
    if let products = self.donationProducts {
      completionHandler(products, .none)
      return
    }
      
    guard InAppPurchaseHelper.shared.canMakePayments() else {
      let error = NSError(domain: "com.amarcus.PiPer.DonationManager",
                          code: 0,
                          userInfo: [NSLocalizedDescriptionKey: "Payments are unavailable"])
      completionHandler(nil, error)
      return
    }
      
    InAppPurchaseHelper.shared.requestProducts(identifiers:DonationManager.identifiers, completionHandler: {
      productResponse, error in
      
      DispatchQueue.main.async {
        guard error == nil else {
          completionHandler(nil, error)
          return
        }
        if let response = productResponse {
          let sortedProducts = response.products.sorted { (product1, product2) -> Bool in
            return product1.price.compare(product2.price) == .orderedAscending
          }
          
          if let cheapestProduct = sortedProducts.first {
            let priceFormatter = NumberFormatter()
            priceFormatter.numberStyle = .currency
            priceFormatter.locale = cheapestProduct.priceLocale
            self.priceFormatter = priceFormatter
            self.smallestDonation = cheapestProduct.price
          }
          
          self.donationProducts = sortedProducts.map {
            DonationProduct(name: $0.localizedTitle,
                            price: self.localizedStringForPrice($0.price)!,
                            emoticon: self.emoticonForPrice($0.price)!,
                            product: $0)
          }
          completionHandler(self.donationProducts, .none)
  
        }
      }
    })
  }
  
  var totalDonations: NSDecimalNumber {
    set {
      guard let priceFormatter = self.priceFormatter else {
        return
      }
      var totalDonationsDictionary = NSUbiquitousKeyValueStore.default.dictionary(forKey: DonationManager.totalDonationsKey) ?? [String:String]()
      let numberString = newValue.description(withLocale: [NSLocale.Key.decimalSeparator: "."])
      totalDonationsDictionary[priceFormatter.currencyCode] = numberString
      NSUbiquitousKeyValueStore.default.set(totalDonationsDictionary, forKey: DonationManager.totalDonationsKey)
      NSUbiquitousKeyValueStore.default.synchronize()
    }
    get {
      guard let priceFormatter = self.priceFormatter,
        let totalDonationsDictionary = NSUbiquitousKeyValueStore.default.dictionary(forKey: DonationManager.totalDonationsKey),
        let numberString = totalDonationsDictionary[priceFormatter.currencyCode] as? String else {
          return NSDecimalNumber.zero
      }
      return NSDecimalNumber(string: numberString)
    }
  }
  
  func buyDonationProduct(_ donationProduct: DonationProduct, completionHandler: @escaping BuyDonationProductCompletionHandler = {_ in}) {
    
    InAppPurchaseHelper.shared.buyProduct(donationProduct.product, completionHandler: {
      transaction in
      DispatchQueue.main.async {
        self.totalDonations = self.totalDonations.adding(donationProduct.product.price)
        completionHandler(transaction)
      }
    })
  }
  
  func donationProductsAvaliable() -> Bool {
    return self.donationProducts != nil
  }
  
  func localizedStringForPrice(_ price: NSDecimalNumber) -> String? {
    guard let priceFormatter = self.priceFormatter else {
      return nil
    }
    return priceFormatter.string(from:price) ?? "\(price)"
  }
  
  func emoticonForPrice(_ decimalPrice: NSDecimalNumber) -> String? {
    guard let baseUnit = self.smallestDonation?.doubleValue else {
      return nil
    }
        
    // Get seasonal emoticons
    let emoticons = Array({
      () -> String in
      switch Calendar.current.dateComponents([.month, .weekdayOrdinal, .weekday, .day], from: Date()) {
      case let date where date.month == 1 && date.day == 1: // New Years
        return "🕛🥂🍾🎊"
      case let date where date.month == 2 && date.day == 14: // Valentine's Day
        return "🥀🌹💋💘"
      case let date where date.month == 10 && date.day == 31: // Halloween
        return "💀👻🧙‍♀️🎃"
      case let date where date.month == 11 && date.weekdayOrdinal == 4 && date.weekday == 5: // Thanksgiving
        return "🍂🍴🍗🇺🇸"
      case let date where date.month == 12 && date.day == 25: // Christmas
        return "🥶🎄🎁🎅"
      default:
        return "😢🙂😃😍"
      }
    }()).map { String($0) }

    // Select emoticon based on price
    let price = decimalPrice.doubleValue
    if price < baseUnit {
      return emoticons[0]
    } else if price < 3 * baseUnit {
      return emoticons[1]
    } else if price < 10 * baseUnit {
      return emoticons[2]
    } else {
      return emoticons[3]
    }
  }

}
