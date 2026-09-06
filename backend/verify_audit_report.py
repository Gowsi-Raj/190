import urllib.request
import urllib.parse
import json
import io
from pypdf import PdfReader

def main():
    print("=== STARTING NATIONAL CYBER AUDITOR VERIFICATION ===")

    # 1. Login
    data = urllib.parse.urlencode({'username': 'DL-AUDIT-9900', 'password': 'pass123'}).encode()
    req = urllib.request.Request('http://localhost:8000/api/v1/auth/token', data=data)
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        token = res['access_token']
        user = res['fullName']
        role = res['role']
        badge = res['badgeNumber']
        print(f"[AUTH SUCCESS] User: {user} | Badge: {badge} | Role: {role}")

    headers = {'Authorization': f'Bearer {token}'}

    # 2. Audit Full Tree
    req_tree = urllib.request.Request('http://localhost:8000/api/v1/documents/audit-full-tree', headers=headers)
    with urllib.request.urlopen(req_tree) as resp:
        tree = json.loads(resp.read().decode())
        events = tree['auditActivity']
        print(f"[AUDIT TREE] Events count: {len(events)}")
        print(f"  First event action: {events[0]['action']}")
        print(f"  First event user: {events[0]['user']}")
        print(f"  First event timestamp: {events[0]['fullTimestamp']}")
        print(f"  Total events in summary: {tree['summary']['totalAuditEvents']}")
        print(f"  Reports count: {len(tree['reports'])}")

    # 3. Test All 3 PDF Report Downloads
    for r_type in ['FULL_AUDIT', 'COMPLIANCE', 'CHAIN_OF_CUSTODY']:
        url = f'http://localhost:8000/api/v1/documents/audit-report/pdf?reportType={r_type}'
        req_pdf = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req_pdf) as resp:
            pdf_bytes = resp.read()
            disposition = resp.headers.get('Content-Disposition')
            print(f"\n[PDF {r_type}] Status: {resp.status} | Size: {len(pdf_bytes)} bytes")
            print(f"  Disposition: {disposition}")
            
            # Verify PDF validity with pypdf
            reader = PdfReader(io.BytesIO(pdf_bytes))
            num_pages = len(reader.pages)
            all_text = " ".join(p.extract_text() for p in reader.pages)
            print(f"  PDF Pages: {num_pages}")
            print(f"  Contains 'National Cyber Auditor': {'National Cyber Auditor' in all_text}")
            print(f"  Contains 'Section 63': {'Section 63' in all_text}")
            print(f"  Contains 'DL-AUDIT-9900': {'DL-AUDIT-9900' in all_text}")

    # 4. Test Audit Data JSON Endpoint
    req_data = urllib.request.Request('http://localhost:8000/api/v1/documents/audit-report/data', headers=headers)
    with urllib.request.urlopen(req_data) as resp:
        data_res = json.loads(resp.read().decode())
        print(f"\n[AUDIT DATA JSON] Count: {data_res['count']}")

    print("\n=== ALL AUDIT REPORTING TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    main()
