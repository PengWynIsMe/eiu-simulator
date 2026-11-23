import Foundation
import PDFKit
let args = CommandLine.arguments
guard args.count == 3, let pdf = PDFDocument(url: URL(fileURLWithPath: args[1])) else { fatalError("usage: pdfkit-pages.swift input.pdf output-dir") }
let output = URL(fileURLWithPath: args[2], isDirectory: true)
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
for index in 0..<pdf.pageCount {
    let body = pdf.page(at: index)?.string ?? ""
    let file = output.appendingPathComponent("p\(String(format: "%02d", index + 1)).txt")
    try (body.trimmingCharacters(in: .whitespacesAndNewlines) + "\n").write(to: file, atomically: true, encoding: .utf8)
}
