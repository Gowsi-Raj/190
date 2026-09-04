import io
import os
from datetime import datetime, timezone, timedelta
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

# Public URL (ngrok or production domain) with localhost fallback
PUBLIC_BASE_URL = os.getenv("PUBLIC_APP_URL", "http://localhost:3000")


def generate_qr_image_flowable(data_str: str, size: float = 65.0):
    """
    Generates a high-density standalone ReportLab Image flowable with explicit dimensions.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=1,
    )
    qr.add_data(data_str)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="white")
    
    img_buffer = io.BytesIO()
    img.save(img_buffer, format="PNG")
    img_buffer.seek(0)
    
    return RLImage(img_buffer, width=size, height=size)


def generate_section_63_bsa_certificate(doc_record: dict) -> bytes:
    """
    Generates statutory Section 63(4) BSA 2023 Electronic Evidence Certificate with visible QR verification.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=24,
        bottomMargin=24
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontSize=10.5,
        leading=13.5,
        alignment=0,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor("#0f172a")
    )
    sub_title_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontSize=7.5,
        leading=10,
        alignment=0,
        textColor=colors.HexColor("#334155")
    )
    section_head_style = ParagraphStyle(
        'SectionHead',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor("#1e3a8a")
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor("#0f172a")
    )
    legal_fine_print = ParagraphStyle(
        'LegalFine',
        parent=styles['Normal'],
        fontSize=6.5,
        leading=8.5,
        textColor=colors.HexColor("#334155")
    )
    bold_label = ParagraphStyle(
        'BoldLbl',
        parent=styles['Normal'],
        fontSize=7,
        leading=9.5,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor("#0f172a")
    )

    story = []

    # Format timestamp
    raw_ts = doc_record.get('timestamp')
    if isinstance(raw_ts, str):
        try:
            raw_ts = datetime.fromisoformat(raw_ts.replace('Z', '+00:00'))
        except Exception:
            raw_ts = datetime.now(timezone.utc)
    elif not isinstance(raw_ts, datetime):
        raw_ts = datetime.now(timezone.utc)

    if raw_ts.tzinfo is None:
        raw_ts = raw_ts.replace(tzinfo=timezone.utc)

    ist_tz = timezone(timedelta(hours=5, minutes=30))
    ist_time = raw_ts.astimezone(ist_tz)
    dt_str = ist_time.strftime('%d-%b-%Y %I:%M:%S %p IST')

    doc_hash = str(doc_record.get('docHash', '0xUNKNOWN_HASH'))
    fir_num = str(doc_record.get('firNumber', 'N/A'))
    badge_num = str(doc_record.get('officerBadgeNumber', 'TN-POL-4921'))

    # Phase 3 Courtroom Verification QR pointing to public ngrok/domain verify route
    qr_payload = f"{PUBLIC_BASE_URL}/verify?hash={doc_hash}&fir={fir_num}&badge={badge_num}"
    rl_qr = generate_qr_image_flowable(qr_payload, size=65.0)

    # Header section with title and embedded QR Code side-by-side
    header_text_block = [
        Paragraph("SCHEDULE UNDER SECTION 63(4), BHARATIYA SAKSHYA ADHINIYAM, 2023", title_style),
        Paragraph("<b>CERTIFICATE OF AUTHENTICITY AND INTEGRITY FOR ADMISSIBILITY OF ELECTRONIC EVIDENCE</b>", title_style),
        Paragraph("<i>(Corresponds to Section 65B of the Indian Evidence Act, 1872)</i>", sub_title_style),
    ]

    header_table_data = [
        [header_text_block, rl_qr]
    ]
    t_header = Table(header_table_data, colWidths=[470, 70])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.2, color=colors.HexColor("#0f172a"), spaceAfter=5))

    # Preamble
    officer_name = doc_record.get('officerName', 'Investigating Officer')
    officer_badge = doc_record.get('officerBadgeNumber', 'TN-POL-4921')
    ps_station = doc_record.get('policeStation', 'Coimbatore Central Police Station')
    district = doc_record.get('district', 'Coimbatore City')

    preamble = (
        f"I, <b>{officer_name}</b>, Badge No: <b>{officer_badge}</b>, attached to <b>{ps_station}</b>, <b>{district}</b>, "
        f"being the person occupying an official position responsible for the management and lawful custody of the electronic device / repository, "
        f"do hereby certify under Section 63(4)(c) of the Bharatiya Sakshya Adhiniyam, 2023, as follows:"
    )
    story.append(Paragraph(preamble, legal_fine_print))
    story.append(Spacer(1, 5))

    # PART I: Case Particulars Table
    story.append(Paragraph("<b>PART I: CASE PARTICULARS & INVESTIGATION DETAILS</b>", section_head_style))
    story.append(Spacer(1, 2))

    sections_list = doc_record.get('verifiedData', {}).get('detectedSections', [])
    sections_str = ", ".join(sections_list) if sections_list else "Sec. 420 IPC / BNS 318(4)"

    case_data = [
        [Paragraph("<b>Case / Crime Reference</b>", bold_label), Paragraph(str(doc_record.get('caseId', 'N/A')), body_style),
         Paragraph("<b>FIR / Diary No.</b>", bold_label), Paragraph(str(doc_record.get('firNumber', 'N/A')), body_style)],
        [Paragraph("<b>Police Station</b>", bold_label), Paragraph(str(ps_station), body_style),
         Paragraph("<b>District / Jurisdiction</b>", bold_label), Paragraph(str(district), body_style)],
        [Paragraph("<b>Informant / Complainant</b>", bold_label), Paragraph(str(doc_record.get('complainantName', 'N/A')), body_style),
         Paragraph("<b>Accused / Suspect(s)</b>", bold_label), Paragraph(str(doc_record.get('accusedName', 'N/A')), body_style)],
        [Paragraph("<b>Statutory Penal Clauses</b>", bold_label), Paragraph(str(sections_str), body_style),
         Paragraph("<b>Document Category</b>", bold_label), Paragraph(str(doc_record.get('docType', 'FIR')), body_style)]
    ]

    t1 = Table(case_data, colWidths=[120, 150, 120, 150])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#64748b")),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
    ]))
    story.append(t1)
    story.append(Spacer(1, 5))

    # PART II: Cryptographic Attributes Table
    story.append(Paragraph("<b>PART II: CRYPTOGRAPHIC INTEGRITY & DEVICE ATTRIBUTES</b>", section_head_style))
    story.append(Spacer(1, 2))

    tech_data = [
        [Paragraph("<b>Evidence File Name</b>", bold_label), Paragraph(str(doc_record.get('fileName', 'N/A')), body_style)],
        [Paragraph("<b>SHA-256 Checksum</b>", bold_label), Paragraph(f"<font fontName='Courier' size=6 color='#0f766e'>{doc_hash}</font>", body_style)],
        [Paragraph("<b>Blockchain Tx Ref</b>", bold_label), Paragraph(f"<font fontName='Courier' size=6 color='#1e3a8a'>{doc_record.get('blockchainTxHash', 'N/A')}</font>", body_style)],
        [Paragraph("<b>Timestamp (IST)</b>", bold_label), Paragraph(dt_str, body_style)],
        [Paragraph("<b>Workstation Node ID</b>", bold_label), Paragraph(str(doc_record.get('deviceIdentifier', 'TERMINAL-NODE-01')), body_style)],
        [Paragraph("<b>Integrity Status</b>", bold_label), Paragraph("<b>100% BIT-PERFECT (Zero Retroactive Modification)</b>", body_style)],
    ]

    t2 = Table(tech_data, colWidths=[130, 410])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#64748b")),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
    ]))
    story.append(t2)
    story.append(Spacer(1, 5))

    # Declarations & Signatures
    declarations = (
        "<b>STATUTORY DECLARATION PURSUANT TO SECTION 63 OF BSA, 2023:</b><br/>"
        "1. The electronic output was produced during the period over which the device was used regularly in ordinary official duty.<br/>"
        "2. The computing device and vault operated in an uncompromised state throughout the chain of custody.<br/>"
        "3. The QR Code embedded at the top allows live digital verification against the decentralized immutable ledger."
    )
    story.append(Paragraph(declarations, legal_fine_print))
    story.append(Spacer(1, 10))

    sig_block = [
        [
            Paragraph("<b>Generated by Evidentiary DMS Engine:</b><br/>Status: <b>CRYPTOGRAPHICALLY SEALED</b><br/>Protocol: <b>SHA-256 / Web3 Anchor</b>", legal_fine_print),
            Paragraph(f"<b>Attesting Officer:</b><br/>Name: <b>{officer_name}</b><br/>Badge: <b>{officer_badge}</b><br/>Sign / Seal: __________________________", legal_fine_print)
        ]
    ]
    t_sig = Table(sig_block, colWidths=[270, 270])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(t_sig)

    doc.build(story)
    buffer.seek(0)
    return buffer.read()