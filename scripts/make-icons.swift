import AppKit
import Foundation

let folder = URL(fileURLWithPath: CommandLine.arguments[1])
try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
func draw(_ size: Int, tray: Bool = false) -> Data {
    let image = NSImage(size: NSSize(width: size, height: size))
    image.lockFocus()
    let s = CGFloat(size)
    if !tray {
        NSColor(calibratedWhite: 0.095, alpha: 1).setFill()
        NSBezierPath(roundedRect: NSRect(x: s * 0.05, y: s * 0.05, width: s * 0.9, height: s * 0.9), xRadius: s * 0.2, yRadius: s * 0.2).fill()
        NSColor(calibratedRed: 1, green: 0.294, blue: 0.294, alpha: 1).setStroke()
    } else { NSColor.black.setStroke() }
    let line = NSBezierPath()
    line.lineWidth = s * 0.075; line.lineCapStyle = .round; line.lineJoinStyle = .round
    line.move(to: NSPoint(x: s * 0.32, y: s * 0.32)); line.line(to: NSPoint(x: s * 0.32, y: s * 0.75)); line.line(to: NSPoint(x: s * 0.52, y: s * 0.75))
    line.curve(to: NSPoint(x: s * 0.52, y: s * 0.43), controlPoint1: NSPoint(x: s * 0.78, y: s * 0.75), controlPoint2: NSPoint(x: s * 0.78, y: s * 0.43))
    line.line(to: NSPoint(x: s * 0.32, y: s * 0.43)); line.stroke()
    let base = NSBezierPath(); base.lineWidth = s * 0.06; base.lineCapStyle = .round
    base.move(to: NSPoint(x: s * 0.25, y: s * 0.23)); base.line(to: NSPoint(x: s * 0.75, y: s * 0.23)); base.stroke()
    image.unlockFocus()
    let rep = NSBitmapImageRep(data: image.tiffRepresentation!)!
    return rep.representation(using: .png, properties: [:])!
}
try draw(1024).write(to: folder.appendingPathComponent("icon.png"))
try draw(36, tray: true).write(to: folder.appendingPathComponent("trayTemplate.png"))
let iconset = folder.appendingPathComponent("icon.iconset")
try FileManager.default.createDirectory(at: iconset, withIntermediateDirectories: true)
for n in [16, 32, 128, 256, 512] {
    try draw(n).write(to: iconset.appendingPathComponent("icon_\(n)x\(n).png"))
    try draw(n * 2).write(to: iconset.appendingPathComponent("icon_\(n)x\(n)@2x.png"))
}
