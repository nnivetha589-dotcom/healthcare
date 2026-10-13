from pathlib import Path


def extract_report_text(path):
    if path.suffix.lower() == ".pdf":
        try:
            import pypdf
            return "\n".join((page.extract_text() or "") for page in pypdf.PdfReader(str(path)).pages)[:20000]
        except Exception:
            return "PDF saved. Install pypdf for text extraction."
    if path.suffix.lower() in {".png", ".jpg", ".jpeg"}:
        try:
            import pytesseract
            from PIL import Image
            return pytesseract.image_to_string(Image.open(path))[:20000]
        except Exception:
            return "Image saved. Optional OCR dependencies are not installed."
    return ""
