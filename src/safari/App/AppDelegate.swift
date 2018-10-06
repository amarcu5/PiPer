//
//  AppDelegate.swift
//  PiPer App
//
//  Created by Adam Marcus on 19/07/2018.
//  Copyright © 2018 Adam Marcus. All rights reserved.
//

import Cocoa

@NSApplicationMain
class AppDelegate: NSObject, NSApplicationDelegate {

  func applicationDidFinishLaunching(_ aNotification: Notification) {
  }

  func applicationWillTerminate(_ aNotification: Notification) {
  }
  
  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
    return true;
  }

}

