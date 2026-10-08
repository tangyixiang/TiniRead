import Foundation
import CoreGraphics
import AppKit

// Check source icon
let projectDir = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let sourceIconPath = projectDir.appendingPathComponent("app-icon.png")

guard let imageSource = CGImageSourceCreateWithURL(sourceIconPath as CFURL, nil),
      let origImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
    print("Error: Could not load app-icon.png")
    exit(1)
}

let width = origImage.width
let height = origImage.height

// Detect content bounds (alpha > 5)
guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
      let detectCtx = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4, space: colorSpace, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
    print("Error: Could not create detect context")
    exit(1)
}

detectCtx.draw(origImage, in: CGRect(x: 0, y: 0, width: width, height: height))
guard let pixelPtr = detectCtx.data?.bindMemory(to: UInt8.self, capacity: width * height * 4) else {
    print("Error: Could not read pixel data")
    exit(1)
}

var minX = width, maxX = -1
var minY = height, maxY = -1

for y in 0..<height {
    for x in 0..<width {
        let alpha = pixelPtr[(y * width + x) * 4 + 3]
        if alpha > 5 {
            if x < minX { minX = x }
            if x > maxX { maxX = x }
            if y < minY { minY = y }
            if y > maxY { maxY = y }
        }
    }
}

guard minX <= maxX, minY <= maxY else {
    print("Error: Empty image")
    exit(1)
}

let contentW = maxX - minX + 1
let contentH = maxY - minY + 1
print("Detected content bounds: [\(minX), \(minY), \(contentW), \(contentH)] in \(width)x\(height)")

// CGImage.cropping(to:) uses top-left origin coordinates
let cropRect = CGRect(x: minX, y: minY, width: contentW, height: contentH)
guard let croppedCG = origImage.cropping(to: cropRect) else {
    print("Error: Cropping failed")
    exit(1)
}

func renderCanvas(cropped: CGImage, targetRatio: CGFloat, canvasSize: Int = 1024) -> CGImage? {
    guard let ctx = CGContext(data: nil, width: canvasSize, height: canvasSize, bitsPerComponent: 8, bytesPerRow: canvasSize * 4, space: colorSpace, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
        return nil
    }
    ctx.interpolationQuality = .high
    let targetSize = CGFloat(canvasSize) * targetRatio
    let scale = targetSize / max(CGFloat(cropped.width), CGFloat(cropped.height))
    let drawW = CGFloat(cropped.width) * scale
    let drawH = CGFloat(cropped.height) * scale
    let drawX = (CGFloat(canvasSize) - drawW) / 2.0
    let drawY = (CGFloat(canvasSize) - drawH) / 2.0
    ctx.draw(cropped, in: CGRect(x: drawX, y: drawY, width: drawW, height: drawH))
    return ctx.makeImage()
}

func savePNG(image: CGImage, to url: URL) {
    guard let dest = CGImageDestinationCreateWithURL(url as CFURL, "public.png" as CFString, 1, nil) else {
        print("Error saving to \(url.path)")
        return
    }
    CGImageDestinationAddImage(dest, image, nil)
    CGImageDestinationFinalize(dest)
}

// 1. Generate full/standard canvas (93% content ratio, optimal for Windows and general web/app)
guard let standardIcon = renderCanvas(cropped: croppedCG, targetRatio: 0.93) else {
    print("Error rendering standard icon")
    exit(1)
}

// 2. Generate macOS HIG canvas (80.5% content ratio = 824px / 1024px)
guard let macIcon = renderCanvas(cropped: croppedCG, targetRatio: 0.805) else {
    print("Error rendering macOS icon")
    exit(1)
}

let tempDir = projectDir.appendingPathComponent(".temp_icons")
try? FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
let tempStdPath = tempDir.appendingPathComponent("std-icon.png")
let tempMacPath = tempDir.appendingPathComponent("mac-icon.png")
let tempMacIconsDir = tempDir.appendingPathComponent("mac_icons")

savePNG(image: standardIcon, to: tempStdPath)
savePNG(image: macIcon, to: tempMacPath)

func runCommand(_ args: [String]) -> Bool {
    let proc = Process()
    proc.currentDirectoryURL = projectDir
    proc.executableURL = URL(fileURLWithPath: "/usr/bin/env")
    proc.arguments = args
    do {
        try proc.run()
        proc.waitUntilExit()
        return proc.terminationStatus == 0
    } catch {
        print("Failed to run: \(args.joined(separator: " "))")
        return false
    }
}

print("Running tauri icon for Windows and general assets...")
let iconsDir = projectDir.appendingPathComponent("src-tauri/icons")
_ = runCommand(["npx", "@tauri-apps/cli", "icon", tempStdPath.path, "-o", iconsDir.path])

print("Running tauri icon for macOS ICNS...")
try? FileManager.default.createDirectory(at: tempMacIconsDir, withIntermediateDirectories: true)
_ = runCommand(["npx", "@tauri-apps/cli", "icon", tempMacPath.path, "-o", tempMacIconsDir.path])

// Replace icon.icns with macOS HIG version
let macICNSSource = tempMacIconsDir.appendingPathComponent("icon.icns")
let macICNSDest = iconsDir.appendingPathComponent("icon.icns")
if FileManager.default.fileExists(atPath: macICNSSource.path) {
    try? FileManager.default.removeItem(at: macICNSDest)
    try? FileManager.default.copyItem(at: macICNSSource, to: macICNSDest)
    print("Updated icon.icns to macOS HIG standard")
}

// Sync app-icon.png to destinations
let targets = [
    projectDir.appendingPathComponent("app-icon.png"),
    projectDir.appendingPathComponent("public/app-icon.png"),
    projectDir.appendingPathComponent("src/assets/app-icon.png"),
    projectDir.appendingPathComponent("showcase-assets/icon.png")
]

for target in targets {
    savePNG(image: standardIcon, to: target)
    print("Updated \(target.lastPathComponent)")
}

// Cleanup
try? FileManager.default.removeItem(at: tempDir)
print("Icon generation completed successfully.")
