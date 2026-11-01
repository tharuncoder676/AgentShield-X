import sys, os
sys.path.insert(0, os.path.abspath('services/control_api/src'))
from control_api.security_hardening import run_security_audit

report = run_security_audit()
print('Audit Score:', report['score'])
print('Compliance Rating:', report['compliance_rating'])
print('Total checks verified:', len(report['checks']))
for check in report['checks']:
    print(f"[{check['status']}] #{check['id']:02d}: {check['check']} ({check['category']}) - {check['details'][:60]}...")

