//
//  ConfettiView.swift
//  PiPer
//
//  Created by Adam Marcus on 22/11/2018.
//  Copyright © 2018 Adam Marcus. All rights reserved.
//

import Cocoa

class ConfettiView: NSView {
  
  private static var colors = [
    NSColor(red:0.95, green:0.40, blue:0.27, alpha:1.0),
    NSColor(red:1.00, green:0.78, blue:0.36, alpha:1.0),
    NSColor(red:0.48, green:0.78, blue:0.64, alpha:1.0),
    NSColor(red:0.30, green:0.76, blue:0.85, alpha:1.0),
    NSColor(red:0.58, green:0.39, blue:0.55, alpha:1.0)
  ]
  
  private var emitter: CAEmitterLayer!
  
  required public init?(coder aDecoder: NSCoder) {
    super.init(coder: aDecoder)
    setup()
  }
  
  public override init(frame: CGRect) {
    super.init(frame: frame)
    setup()
  }
  
  private func setup() {

    // Set up confetti emitter layer
    emitter = CAEmitterLayer()
    emitter.emitterShape = CAEmitterLayerEmitterShape.line
    emitter.birthRate = 0
    
    // Set confetti emitter layer position/size and respond to view frame changes
    self.postsFrameChangedNotifications = true
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(setEmitterFrame),
      name: NSView.frameDidChangeNotification,
      object: self)
    setEmitterFrame()
    
    // Add emitter cells for each confetti color
    var cells = [CAEmitterCell]()
    for color in ConfettiView.colors {
      cells.append(confettiWithColor(color: color))
    }
    emitter.emitterCells = cells
    
    // Add confetti emitter layer
    self.wantsLayer = true
    self.layer!.addSublayer(emitter)
  }
  
  @objc private func setEmitterFrame() {
    
    // Position confetti emitter offscreen and size to fit view
    emitter.emitterPosition = CGPoint(x: frame.size.width * 0.5,
                                      y: frame.size.height + 32)
    emitter.emitterSize = CGSize(width: frame.size.width,
                                 height: 1)
  }
  
  public func dropConfetti() {
    
    // Set confetti emitter to show particles start spawning from emitter position
    emitter.beginTime = CACurrentMediaTime()
    
    // Animate confetti emitter birth rate to spawn a burst of confetti
    let birthRateDecayAnimation = CABasicAnimation()
    birthRateDecayAnimation.timingFunction = CAMediaTimingFunction(name: CAMediaTimingFunctionName.easeOut)
    birthRateDecayAnimation.duration = CFTimeInterval(1.0)
    birthRateDecayAnimation.fromValue = NSNumber(value: 1.0)
    birthRateDecayAnimation.toValue = NSNumber(value: 0.0)
    emitter.add(birthRateDecayAnimation, forKey: "birthRate")
  }
  
  // Generate a diamond CGImage representing confetti
  private func getDiamondImage() -> CGImage? {
    let image = NSImage(size: CGSize(width: 24, height: 32), flipped: false) { _ in
      let path = NSBezierPath()
      path.move(to: NSPoint(x: 12, y: 0))
      path.line(to: NSPoint(x: 24, y: 16))
      path.line(to: NSPoint(x: 12, y: 32))
      path.line(to: NSPoint(x: 0, y: 16))
      path.line(to: NSPoint(x: 12, y: 0))
      NSColor.white.setFill()
      path.fill()
      return true
    }
    return image.cgImage(forProposedRect: nil, context: nil, hints: nil)
  }
  
  // Setup an confetti emitter cell with a specific color
  private func confettiWithColor(color: NSColor) -> CAEmitterCell {
    let confetti = CAEmitterCell()
    confetti.birthRate = 400.0
    confetti.lifetime = 10.0
    confetti.alphaSpeed = -1.0 / confetti.lifetime
    confetti.color = color.cgColor
    confetti.velocity = 200.0
    confetti.velocityRange = 200.0
    confetti.emissionRange = CGFloat(Double.pi * 0.5)
    confetti.spin = 3.0
    confetti.spinRange = 3.0
    confetti.scale = 0.15
    confetti.scaleRange = 0.15
    confetti.contents = getDiamondImage()
    return confetti
  }
}
