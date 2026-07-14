import AppKit
import CoreGraphics
import Foundation

let size = 1024
let output = CommandLine.arguments.dropFirst().first ?? "build/icon.png"
guard let bitmap = NSBitmapImageRep(
  bitmapDataPlanes: nil,
  pixelsWide: size,
  pixelsHigh: size,
  bitsPerSample: 8,
  samplesPerPixel: 4,
  hasAlpha: true,
  isPlanar: false,
  colorSpaceName: .deviceRGB,
  bytesPerRow: 0,
  bitsPerPixel: 0
), let context = NSGraphicsContext(bitmapImageRep: bitmap)?.cgContext else {
  fatalError("Unable to create icon bitmap")
}

func color(_ red: CGFloat, _ green: CGFloat, _ blue: CGFloat, _ alpha: CGFloat = 1) -> CGColor {
  CGColor(red: red / 255, green: green / 255, blue: blue / 255, alpha: alpha)
}

context.setFillColor(color(23, 23, 23))
context.addPath(CGPath(roundedRect: CGRect(x: 0, y: 0, width: 1024, height: 1024), cornerWidth: 224, cornerHeight: 224, transform: nil))
context.fillPath()
context.setFillColor(color(244, 244, 241))
context.addPath(CGPath(roundedRect: CGRect(x: 54, y: 54, width: 916, height: 916), cornerWidth: 176, cornerHeight: 176, transform: nil))
context.fillPath()

context.setStrokeColor(color(23, 23, 23, 0.09))
context.setLineWidth(3)
for position in [280, 512, 744] {
  context.move(to: CGPoint(x: 116, y: position))
  context.addLine(to: CGPoint(x: 908, y: position))
  context.move(to: CGPoint(x: position, y: 116))
  context.addLine(to: CGPoint(x: position, y: 908))
}
context.strokePath()

context.setStrokeColor(color(17, 17, 17))
context.setLineCap(.square)
context.setLineJoin(.miter)
context.setLineWidth(86)
context.move(to: CGPoint(x: 284, y: 814))
context.addLine(to: CGPoint(x: 284, y: 248))
context.addLine(to: CGPoint(x: 674, y: 248))
context.strokePath()
context.setLineWidth(54)
context.move(to: CGPoint(x: 692, y: 836))
context.addLine(to: CGPoint(x: 468, y: 202))
context.strokePath()
context.setStrokeColor(color(17, 17, 17, 0.48))
context.setLineWidth(15)
context.move(to: CGPoint(x: 732, y: 814))
context.addLine(to: CGPoint(x: 508, y: 180))
context.strokePath()

context.saveGState()
context.translateBy(x: 790, y: 248)
context.rotate(by: 4 * .pi / 180)
context.setFillColor(color(183, 53, 45))
context.addPath(CGPath(roundedRect: CGRect(x: -76, y: -76, width: 152, height: 152), cornerWidth: 18, cornerHeight: 18, transform: nil))
context.fillPath()
context.setStrokeColor(color(244, 244, 241))
context.setLineWidth(15)
context.move(to: CGPoint(x: -38, y: 28))
context.addLine(to: CGPoint(x: 38, y: 28))
context.move(to: CGPoint(x: -40, y: -10))
context.addLine(to: CGPoint(x: 26, y: -10))
context.move(to: CGPoint(x: -16, y: 48))
context.addLine(to: CGPoint(x: -16, y: -50))
context.strokePath()
context.restoreGState()

guard let png = bitmap.representation(using: .png, properties: [:]) else {
  fatalError("Unable to encode icon PNG")
}
try png.write(to: URL(fileURLWithPath: output), options: .atomic)
