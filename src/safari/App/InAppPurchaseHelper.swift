//
//  InAppPurchaseHelper.swift
//  PiPer
//
//  Created by Adam Marcus on 18/11/2018.
//  Copyright © 2018 Adam Marcus. All rights reserved.
//

import Foundation
import StoreKit

class InAppPurchaseHelper: NSObject {
  
  static let shared = InAppPurchaseHelper()
  
  public typealias RequestProductsCompletionHandler = (_ response: SKProductsResponse?, _ error: Error?) -> ()
  public typealias BuyProductCompletionHandler = (_ transaction: SKPaymentTransaction) -> ()
  
  private var productsRequestsInProgress = [SKRequest:RequestProductsCompletionHandler]()
  private var purchasesInProgress = [SKPayment:BuyProductCompletionHandler]()
  private let paymentQueue = SKPaymentQueue.default()
  
  private override init() {
    super.init()
    self.paymentQueue.add(self)
  }
  deinit {
    self.paymentQueue.remove(self)
  }
  
  func requestProducts(identifiers: Set<String>, completionHandler: @escaping RequestProductsCompletionHandler) {
    let request = SKProductsRequest(productIdentifiers: identifiers)
    self.productsRequestsInProgress[request] = completionHandler
    request.delegate = self
    request.start()
  }
  
  func buyProduct(_ product: SKProduct, completionHandler: @escaping BuyProductCompletionHandler) {
    let payment = SKPayment(product: product)
    self.purchasesInProgress[payment] = completionHandler
    self.paymentQueue.add(payment)
  }

  func canMakePayments() -> Bool {
    return SKPaymentQueue.canMakePayments()
  }
  
}

extension InAppPurchaseHelper: SKProductsRequestDelegate {
  
  func productsRequest(_ request: SKProductsRequest, didReceive response: SKProductsResponse) {
    if let completionHandler = self.productsRequestsInProgress[request] {
      completionHandler(response, .none)
    }
    self.productsRequestsInProgress.removeValue(forKey: request)
  }
  
  func request(_ request: SKRequest, didFailWithError error: Error) {
    if let completionHandler = self.productsRequestsInProgress[request] {
      completionHandler(.none, error)
    }
    self.productsRequestsInProgress.removeValue(forKey: request)
  }
}


extension InAppPurchaseHelper: SKPaymentTransactionObserver {
  
  func paymentQueue(_ queue: SKPaymentQueue,
                    updatedTransactions transactions: [SKPaymentTransaction]) {
    for transaction in transactions {
      switch transaction.transactionState {
      case .purchased, .failed, .restored:
        if let completionHandler = self.purchasesInProgress[transaction.payment] {
          completionHandler(transaction)
          self.purchasesInProgress.removeValue(forKey: transaction.payment)
        }
        queue.finishTransaction(transaction)
        break
      case .purchasing, .deferred:
        break
      }
    }
  }

}
