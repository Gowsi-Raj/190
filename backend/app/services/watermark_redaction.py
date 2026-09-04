import io
import re
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
from pypdf import PdfReader, PdfWriter


def redact_sensitive_pii(raw_text: str) -> str:
    """
    Masks sensitive personally identifiable information (PII) including
    phone numbers, financial accounts, and national ID patterns.
    """
    text = raw_text

    # Redact 12-digit Indian National ID patterns (Aadhaar / Virtual ID)
    aadhaar_pattern = r'\b\d{4}\s?\d{4}\s?\d{4}\b'
    text = re.sub(aadhaar_pattern, "[ID REDACTED - SEC 63 BSA]", text)

    # Redact 10-digit Indian Mobile Numbers
    phone_pattern = r'(?:\+91[\-\s]?)?[6789]\d{9}\b'
    text = re.sub(phone_pattern, "[MOBILE REDACTED]", text)

    # Redact PAN numbers
    pan_pattern = r'[A-Z]{5}[0-9]{4}[A-Z]{1}'
    text = re.sub(pan_pattern, "[PAN REDACTED]", text)

    # Redact bank account numbers (9-18 continuous digits)
    bank_pattern = r'\b\d{9,18}\b'
    text = re.sub(bank_pattern, "[ACC NUM REDACTED]", text)

    return text


def create_diagonal_watermark_overlay(watermark_text: str, width: float, height: float) -> io.BytesIO:
    """
    Generates a semi-transparent forensic watermark stamp canvas matching page dimensions.
    """
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(width, height))
    
    # Semi-transparent red/gray stamp
    can.setFillColor(Color(0.8, 0.1, 0.1, alpha=0.18))
    can.setFont("Helvetica-Bold", 16)

    # Rotate 45 degrees around center of page
    can.saveState()
    can.translate(width / 2.0, height / 2.0)
    can.rotate(45)

    # Stamp text
    lines = [
        "CONFIDENTIAL LAW ENFORCEMENT RECORD",
        watermark_text,
        "UNAUTHORIZED SHARING IS PUNISHABLE UNDER BSA / IT ACT"
    ]
    
    y_offset = 20
    for line in lines:
        can.drawCentredString(0, y_offset, line)
        y_offset -= 22

    can.restoreState()
    can.save()
    packet.seek(0)
    return packet


def apply_forensic_watermark(pdf_bytes: bytes, officer_badge: str, station: str, timestamp_str: str) -> bytes:
    """
    Applies an unremovable forensic watermark containing officer badge,
    jurisdiction, and exact request timestamp to all PDF pages.
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    writer = PdfWriter()

    stamp_text = f"OFFICER: {officer_badge} | STATION: {station} | TIME: {timestamp_str}"

    for page in reader.pages:
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)

        watermark_pdf = create_diagonal_watermark_overlay(stamp_text, page_width, page_height)
        watermark_reader = PdfReader(watermark_pdf)
        watermark_page = watermark_reader.pages[0]

        page.merge_page(watermark_page)
        writer.add_page(page)

    output_stream = io.BytesIO()
    writer.write(output_stream)
    output_stream.seek(0)
    return output_stream.read()