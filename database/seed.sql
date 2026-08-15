-- Sample data for the Employee Compliance Tracking System.
-- 10 employees, 20 compliance records covering ACTIVE, EXPIRING_SOON,
-- EXPIRED and RENEWED lifecycle states. Dates are computed relative to
-- CURRENT_DATE so the demo data stays meaningful no matter when it's loaded.
--
-- Usage: psql -d compliance_tracker -f database/schema.sql -f database/seed.sql

BEGIN;

DELETE FROM compliance_records;
DELETE FROM employees;

INSERT INTO employees (id, employee_code, first_name, last_name, email, department) VALUES
  ('11111111-1111-4111-8111-111111111101', 'EMP-1001', 'Ava',     'Thompson',  'ava.thompson@company.com',   'Engineering'),
  ('11111111-1111-4111-8111-111111111102', 'EMP-1002', 'Liam',    'Garcia',    'liam.garcia@company.com',    'Engineering'),
  ('11111111-1111-4111-8111-111111111103', 'EMP-1003', 'Sophia',  'Nguyen',    'sophia.nguyen@company.com',  'Sales'),
  ('11111111-1111-4111-8111-111111111104', 'EMP-1004', 'Noah',    'Patel',     'noah.patel@company.com',     'Sales'),
  ('11111111-1111-4111-8111-111111111105', 'EMP-1005', 'Olivia',  'Martinez',  'olivia.martinez@company.com','Human Resources'),
  ('11111111-1111-4111-8111-111111111106', 'EMP-1006', 'Ethan',   'Kim',       'ethan.kim@company.com',      'Human Resources'),
  ('11111111-1111-4111-8111-111111111107', 'EMP-1007', 'Isabella','Rossi',     'isabella.rossi@company.com', 'Finance'),
  ('11111111-1111-4111-8111-111111111108', 'EMP-1008', 'Mason',   'Ibrahim',   'mason.ibrahim@company.com',  'Finance'),
  ('11111111-1111-4111-8111-111111111109', 'EMP-1009', 'Mia',     'Dubois',    'mia.dubois@company.com',     'Operations'),
  ('11111111-1111-4111-8111-111111111110', 'EMP-1010', 'Lucas',   'Schmidt',   'lucas.schmidt@company.com',  'Operations');

-- ACTIVE: expiry more than 30 days out (8 records)
INSERT INTO compliance_records (id, employee_id, compliance_type, issued_date, expiry_date, status, document_url, notes) VALUES
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111101', 'Visa',              CURRENT_DATE - INTERVAL '200 days', CURRENT_DATE + INTERVAL '365 days', 'ACTIVE', 'https://docs.company.com/visa/EMP-1001.pdf', 'H-1B visa'),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111102', 'Certification',     CURRENT_DATE - INTERVAL '100 days', CURRENT_DATE + INTERVAL '260 days', 'ACTIVE', 'https://docs.company.com/certs/EMP-1002.pdf', 'AWS Solutions Architect'),
  ('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111103', 'Background Check',  CURRENT_DATE - INTERVAL '300 days', CURRENT_DATE + INTERVAL '65 days',  'ACTIVE', NULL, 'Annual background screening'),
  ('22222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111104', 'Training',          CURRENT_DATE - INTERVAL '30 days',  CURRENT_DATE + INTERVAL '335 days', 'ACTIVE', 'https://docs.company.com/training/EMP-1004.pdf', 'Workplace safety training'),
  ('22222222-2222-4222-8222-222222222205', '11111111-1111-4111-8111-111111111105', 'Work Permit',       CURRENT_DATE - INTERVAL '150 days', CURRENT_DATE + INTERVAL '215 days', 'ACTIVE', NULL, NULL),
  ('22222222-2222-4222-8222-222222222206', '11111111-1111-4111-8111-111111111106', 'Visa',              CURRENT_DATE - INTERVAL '60 days',  CURRENT_DATE + INTERVAL '120 days', 'ACTIVE', 'https://docs.company.com/visa/EMP-1006.pdf', 'L-1 visa'),
  ('22222222-2222-4222-8222-222222222207', '11111111-1111-4111-8111-111111111107', 'Certification',     CURRENT_DATE - INTERVAL '400 days', CURRENT_DATE + INTERVAL '90 days',  'ACTIVE', 'https://docs.company.com/certs/EMP-1007.pdf', 'CPA license'),
  ('22222222-2222-4222-8222-222222222208', '11111111-1111-4111-8111-111111111108', 'Background Check',  CURRENT_DATE - INTERVAL '90 days',  CURRENT_DATE + INTERVAL '275 days', 'ACTIVE', NULL, NULL);

-- EXPIRING_SOON: expiry within the next 30 days (6 records)
INSERT INTO compliance_records (id, employee_id, compliance_type, issued_date, expiry_date, status, document_url, notes) VALUES
  ('22222222-2222-4222-8222-222222222209', '11111111-1111-4111-8111-111111111109', 'Work Permit',       CURRENT_DATE - INTERVAL '350 days', CURRENT_DATE + INTERVAL '5 days',  'EXPIRING_SOON', NULL, 'Renewal in progress'),
  ('22222222-2222-4222-8222-222222222210', '11111111-1111-4111-8111-111111111110', 'Visa',              CURRENT_DATE - INTERVAL '340 days', CURRENT_DATE + INTERVAL '10 days', 'EXPIRING_SOON', 'https://docs.company.com/visa/EMP-1010.pdf', 'H-1B extension filed'),
  ('22222222-2222-4222-8222-222222222211', '11111111-1111-4111-8111-111111111101', 'Training',          CURRENT_DATE - INTERVAL '335 days', CURRENT_DATE + INTERVAL '15 days', 'EXPIRING_SOON', NULL, 'Fire safety recertification due'),
  ('22222222-2222-4222-8222-222222222212', '11111111-1111-4111-8111-111111111102', 'Certification',     CURRENT_DATE - INTERVAL '330 days', CURRENT_DATE + INTERVAL '18 days', 'EXPIRING_SOON', 'https://docs.company.com/certs/EMP-1002-b.pdf', 'PMP certification'),
  ('22222222-2222-4222-8222-222222222213', '11111111-1111-4111-8111-111111111103', 'Background Check',  CURRENT_DATE - INTERVAL '345 days', CURRENT_DATE + INTERVAL '22 days', 'EXPIRING_SOON', NULL, NULL),
  ('22222222-2222-4222-8222-222222222214', '11111111-1111-4111-8111-111111111104', 'Work Permit',       CURRENT_DATE - INTERVAL '355 days', CURRENT_DATE + INTERVAL '28 days', 'EXPIRING_SOON', NULL, 'Awaiting government processing');

-- EXPIRED: expiry date already in the past (4 records)
INSERT INTO compliance_records (id, employee_id, compliance_type, issued_date, expiry_date, status, document_url, notes) VALUES
  ('22222222-2222-4222-8222-222222222215', '11111111-1111-4111-8111-111111111105', 'Certification',     CURRENT_DATE - INTERVAL '400 days', CURRENT_DATE - INTERVAL '5 days',  'EXPIRED', 'https://docs.company.com/certs/EMP-1005.pdf', 'Expired — needs renewal'),
  ('22222222-2222-4222-8222-222222222216', '11111111-1111-4111-8111-111111111106', 'Training',          CURRENT_DATE - INTERVAL '395 days', CURRENT_DATE - INTERVAL '12 days', 'EXPIRED', NULL, 'Compliance training lapsed'),
  ('22222222-2222-4222-8222-222222222217', '11111111-1111-4111-8111-111111111107', 'Work Permit',       CURRENT_DATE - INTERVAL '410 days', CURRENT_DATE - INTERVAL '20 days', 'EXPIRED', NULL, 'Escalated to HR'),
  ('22222222-2222-4222-8222-222222222218', '11111111-1111-4111-8111-111111111108', 'Visa',              CURRENT_DATE - INTERVAL '420 days', CURRENT_DATE - INTERVAL '30 days', 'EXPIRED', 'https://docs.company.com/visa/EMP-1008.pdf', 'Visa expired, employee on leave');

-- RENEWED: manually renewed, notification flags already settled (2 records)
INSERT INTO compliance_records (id, employee_id, compliance_type, issued_date, expiry_date, status, document_url, notes, expiring_notification_sent, expired_notification_sent) VALUES
  ('22222222-2222-4222-8222-222222222219', '11111111-1111-4111-8111-111111111109', 'Certification',     CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '355 days', 'RENEWED', 'https://docs.company.com/certs/EMP-1009-renewed.pdf', 'Renewed early', true, false),
  ('22222222-2222-4222-8222-222222222220', '11111111-1111-4111-8111-111111111110', 'Background Check',  CURRENT_DATE - INTERVAL '5 days',  CURRENT_DATE + INTERVAL '360 days', 'RENEWED', NULL, 'Re-screened after renewal', false, false);

COMMIT;
