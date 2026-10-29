import Cocoa
import Vision
import CoreImage

let args = CommandLine.arguments
guard args.count >= 3 else {
    FileHandle.standardError.write("usage: swift cutout.swift <input> <output.png>\n".data(using: .utf8)!)
    exit(1)
}

let inputURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2])

guard let nsImage = NSImage(contentsOf: inputURL),
      let tiffData = nsImage.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiffData),
      let cgImage = bitmap.cgImage else {
    FileHandle.standardError.write("Failed to load image at \(inputURL.path)\n".data(using: .utf8)!)
    exit(1)
}

print("Loaded image: \(cgImage.width) x \(cgImage.height)")

let request = VNGeneratePersonSegmentationRequest()
request.qualityLevel = .accurate
request.outputPixelFormat = kCVPixelFormatType_OneComponent8

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

do {
    try handler.perform([request])
    guard let observation = request.results?.first,
          let maskBuffer = observation.pixelBuffer as CVPixelBuffer? else {
        FileHandle.standardError.write("No segmentation produced\n".data(using: .utf8)!)
        exit(1)
    }

    let originalCI = CIImage(cgImage: cgImage)
    let maskCI = CIImage(cvPixelBuffer: maskBuffer)

    // Scale mask up to the original image size (mask is usually smaller)
    let sx = originalCI.extent.width / maskCI.extent.width
    let sy = originalCI.extent.height / maskCI.extent.height
    let scaledMask = maskCI.transformed(by: CGAffineTransform(scaleX: sx, y: sy))

    // Slight edge softening on the mask to avoid hard pixel jaggies
    let softMask: CIImage
    if let blur = CIFilter(name: "CIGaussianBlur") {
        blur.setValue(scaledMask, forKey: kCIInputImageKey)
        blur.setValue(1.0, forKey: kCIInputRadiusKey)
        softMask = blur.outputImage ?? scaledMask
    } else {
        softMask = scaledMask
    }

    // Blend original onto transparent using the mask
    guard let blend = CIFilter(name: "CIBlendWithMask") else {
        FileHandle.standardError.write("Could not create blend filter\n".data(using: .utf8)!)
        exit(1)
    }
    let clear = CIImage(color: CIColor.clear).cropped(to: originalCI.extent)
    blend.setValue(originalCI, forKey: kCIInputImageKey)
    blend.setValue(clear, forKey: kCIInputBackgroundImageKey)
    blend.setValue(softMask, forKey: kCIInputMaskImageKey)

    guard let outputCI = blend.outputImage else {
        FileHandle.standardError.write("Blend failed\n".data(using: .utf8)!)
        exit(1)
    }

    let context = CIContext(options: [.useSoftwareRenderer: false])
    guard let cgOut = context.createCGImage(
        outputCI,
        from: originalCI.extent,
        format: .RGBA8,
        colorSpace: CGColorSpace(name: CGColorSpace.sRGB)
    ) else {
        FileHandle.standardError.write("createCGImage failed\n".data(using: .utf8)!)
        exit(1)
    }

    let outBitmap = NSBitmapImageRep(cgImage: cgOut)
    guard let png = outBitmap.representation(using: .png, properties: [:]) else {
        FileHandle.standardError.write("PNG encode failed\n".data(using: .utf8)!)
        exit(1)
    }
    try png.write(to: outputURL)
    print("Saved: \(outputURL.path) (\(cgOut.width) x \(cgOut.height))")
} catch {
    FileHandle.standardError.write("Error: \(error.localizedDescription)\n".data(using: .utf8)!)
    exit(1)
}
