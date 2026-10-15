import AppKit
import CoreGraphics
import Foundation

// Read-only native evidence. Only the test surface and Perch are included.
let information = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] ?? []
let windows = information.filter { ["Perch", "TextEdit"].contains($0[kCGWindowOwnerName as String] as? String ?? "") }.map { item -> [String: Any] in
    ["app": item[kCGWindowOwnerName as String] ?? "", "bounds": item[kCGWindowBounds as String] ?? [:], "layer": item[kCGWindowLayer as String] ?? 0, "onscreen": item[kCGWindowIsOnscreen as String] ?? false]
}
let result: [String: Any] = ["frontmost": NSWorkspace.shared.frontmostApplication?.bundleIdentifier ?? "", "windows": windows]
let data = try JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys])
print(String(data: data, encoding: .utf8)!)
