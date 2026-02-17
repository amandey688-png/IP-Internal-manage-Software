-- Fix Company Name for existing tickets (run once if you already inserted with NULL company_name)
-- Updates tickets.company_name so the UI shows the correct company.

UPDATE public.tickets SET company_name = 'Demo_c' WHERE reference_no IN (
  'BU-001','BU-002','CH-001','CH-002','CH-003','CH-004','CH-005','CH-006','CH-007','CH-008','CH-009','CH-010','CH-011','CH-012','CH-013','CH-014','CH-015','CH-016','CH-017','CH-018','CH-019','CH-020','CH-021','CH-022','CH-023','CH-024','CH-025','CH-026','CH-027','CH-039','CH-040','CH-044','CH-045','CH-046','CH-047','CH-048','CH-049','CH-050','CH-051','CH-052','CH-053','CH-054','CH-055','CH-056','CH-057','CH-058','CH-059','CH-060','CH-061','CH-062','CH-063','CH-081','CH-085'
);
UPDATE public.tickets SET company_name = 'Ghankun Steel Pvt Ltd (SMS Division)' WHERE reference_no = 'CH-028';
UPDATE public.tickets SET company_name = 'Crescent Foundry' WHERE reference_no = 'CH-029';
UPDATE public.tickets SET company_name = 'Kodarma Chemical Pvt. Ltd.' WHERE reference_no = 'CH-031';
UPDATE public.tickets SET company_name = 'Nirmaan TMT' WHERE reference_no = 'CH-035';
UPDATE public.tickets SET company_name = 'Spintech Tubes Pvt Ltd' WHERE reference_no = 'CH-036';
UPDATE public.tickets SET company_name = 'Indo East Corporation Private Limited' WHERE reference_no = 'CH-037';
UPDATE public.tickets SET company_name = 'Karnikripa Power Pvt Ltd' WHERE reference_no IN ('CH-038','BU-008');
UPDATE public.tickets SET company_name = 'BIHAR FOUNDRY' WHERE reference_no IN ('CH-041','CH-049','CH-050','CH-051','CH-054','CH-058','CH-062','BU-006','CH-064','CH-065','CH-066','CH-067','CH-068','CH-069','CH-070','CH-071','CH-072','CH-073');
UPDATE public.tickets SET company_name = 'Flexicom Industries Pvt. Ltd.' WHERE reference_no = 'BU-004';
UPDATE public.tickets SET company_name = 'Bhagwati Power Pvt. Ltd.' WHERE reference_no IN ('CH-063','CH-064','CH-065','CH-066','CH-067','CH-068','CH-069','CH-070','CH-072','CH-073','CH-074','CH-075','CH-076','CH-077','CH-078','BU-007','CH-079');
