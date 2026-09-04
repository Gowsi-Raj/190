import hashlib
import os
import io
import re
import cv2
import numpy as np
import pytesseract
from PIL import Image, ImageOps
from pypdf import PdfReader

# Configure Tesseract path across common Windows installation directories
if os.name == 'nt':
    possible_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe")
    ]
    for path in possible_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            break

# Ensure storage directory exists
STORAGE_DIR = os.getenv("STORAGE_LOCAL_DIR", "./vault_storage")
os.makedirs(STORAGE_DIR, exist_ok=True)


def compute_sha256(file_bytes: bytes) -> str:
    """Computes cryptographic SHA-256 hash for document integrity."""
    hasher = hashlib.sha256()
    hasher.update(file_bytes)
    return hasher.hexdigest()


def optimize_cv_image(image_bgr: np.ndarray) -> np.ndarray:
    """Enhances image contrast and sharpens text characters."""
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    
    # Upscale if low resolution
    h, w = gray.shape[:2]
    if max(h, w) < 2200:
        gray = cv2.resize(gray, (0, 0), fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)

    clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    filtered = cv2.bilateralFilter(enhanced, 7, 50, 50)
    return filtered


def run_tesseract_ocr(image: Image.Image) -> str:
    """Executes OCR with Tamil, English, and Hindi language support."""
    try:
        installed_langs = pytesseract.get_languages(config='')
    except Exception:
        installed_langs = ['eng']

    active_langs = ['eng']
    if 'tam' in installed_langs:
        active_langs.insert(0, 'tam')
    if 'hin' in installed_langs:
        active_langs.append('hin')

    lang_str = "+".join(active_langs)
    
    cv_img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    processed = optimize_cv_image(cv_img)

    custom_config = f'--oem 1 --psm 3 -l {lang_str}'
    text = pytesseract.image_to_string(processed, config=custom_config)
    
    if len(text.strip()) < 30:
        custom_config = f'--oem 1 --psm 6 -l {lang_str}'
        text = pytesseract.image_to_string(processed, config=custom_config)
        
    return text


def extract_ocr_and_sections(file_bytes: bytes) -> dict:
    """
    Extracts text from PDF documents (digital & scanned) or image files,
    then parses statutory legal clauses.
    """
    raw_text = ""
    is_pdf = file_bytes.startswith(b'%PDF-')

    if is_pdf:
        # 1. Digital text extraction via pypdf (handles typed Tamil & English PDFs)
        try:
            pdf_stream = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_stream)
            extracted_pages = []
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    extracted_pages.append(t)
            raw_text = "\n\n".join(extracted_pages).strip()
        except Exception as e:
            print(f"[PDF Text Extraction Note]: {e}")

        # 2. If scanned/raster PDF, render pages via pdf2image
        if not raw_text:
            try:
                from pdf2image import convert_from_bytes
                images = convert_from_bytes(file_bytes, first_page=1, last_page=3)
                ocr_pages = [run_tesseract_ocr(img) for img in images]
                raw_text = "\n\n".join(ocr_pages).strip()
            except Exception as e:
                print(f"[PDF Rasterization Warning]: {e}")
                raw_text = raw_text or ""
    else:
        # Standard Image file (PNG, JPG, etc.)
        try:
            pil_img = Image.open(io.BytesIO(file_bytes))
            pil_img = ImageOps.exif_transpose(pil_img)
            raw_text = run_tesseract_ocr(pil_img)
        except Exception as e:
            print(f"[Image OCR Error]: {e}")
            raw_text = ""

    clean_text = raw_text.strip()

    # Regex heuristic for legal clauses (BNS, IPC, CrPC, BSA, IT Act, Tamil sections)
    sections_pattern = r'(?:BNS|IPC|CrPC|BSA|IT\s*Act|Section|Sec\.?|பிரிவு|சட்டம்|வட்டம்|சர்வே)\s*[\d]+[A-Za-z]?'
    detected_sections = list(set(re.findall(sections_pattern, clean_text, re.IGNORECASE)))

    confidence = 0.96 if len(clean_text) > 80 else (0.60 if len(clean_text) > 20 else 0.0)

    # Returns both snake_case and camelCase to prevent key mismatch errors
    return {
        "raw_text": clean_text if clean_text else "No extractable text found in PDF/Image.",
        "detected_sections": detected_sections,
        "detectedSections": detected_sections,
        "confidence": confidence,
        "confidenceScore": confidence
    }


def save_raw_document(file_bytes: bytes, doc_hash: str, file_name: str) -> str:
    """Persists the raw uploaded document named by its SHA-256 hash."""
    ext = os.path.splitext(file_name)[1]
    if not ext:
        ext = ".bin"
    
    file_path = os.path.join(STORAGE_DIR, f"{doc_hash}{ext}")
    with open(file_path, "wb") as f:
        f.write(file_bytes)
        
    return file_path