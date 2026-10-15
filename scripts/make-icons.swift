import AppKit
import Foundation

let folder = URL(fileURLWithPath: CommandLine.arguments[1])
try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
func draw(_ size: Int, tray: Bool = false) -> Data {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    let s = CGFloat(size)
    // Match the 24-point chair/play geometry in assets/logo.svg and src/icons.js.
    func point(_ x: CGFloat, _ y: CGFloat) -> NSPoint {
        NSPoint(x: x * s / 24, y: (24 - y) * s / 24)
    }
    if !tray {
        NSColor(srgbRed: 0.095, green: 0.095, blue: 0.095, alpha: 1).setFill()
        NSBezierPath(roundedRect: NSRect(x: s * 0.05, y: s * 0.05, width: s * 0.9, height: s * 0.9), xRadius: s * 0.2, yRadius: s * 0.2).fill()
    }
    let ink = tray ? NSColor.black : NSColor.white
    ink.setStroke()
    let chair = NSBezierPath()
    chair.lineWidth = s / 24 * 1.4
    chair.lineCapStyle = .round
    chair.lineJoinStyle = .round
    chair.move(to: point(5, 16)); chair.line(to: point(5, 5))
    chair.line(to: point(16, 5)); chair.line(to: point(16, 7))
    chair.move(to: point(5, 16)); chair.line(to: point(20, 16))
    chair.move(to: point(7, 16)); chair.line(to: point(5, 21))
    chair.move(to: point(18, 16)); chair.line(to: point(20, 21))
    chair.stroke()

    let tile = NSBezierPath(roundedRect: NSRect(x: s * 7 / 24, y: s * 9 / 24, width: s * 13 / 24, height: s * 8 / 24), xRadius: s * 2 / 24, yRadius: s * 2 / 24)
    if tray {
        tile.lineWidth = s / 24 * 1.4
        tile.stroke()
    } else {
        NSColor(srgbRed: 1, green: 0.294, blue: 0.294, alpha: 1).setFill()
        tile.fill()
    }
    ink.setFill()
    let play = NSBezierPath()
    play.move(to: point(12, 9)); play.line(to: point(16, 11))
    play.line(to: point(12, 13)); play.close(); play.fill()
    NSGraphicsContext.restoreGraphicsState()
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
