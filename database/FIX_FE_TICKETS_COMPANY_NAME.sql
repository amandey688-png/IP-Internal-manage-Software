-- ============================================================================
-- Fix company_name for FE-xxxx (feature) tickets only
-- Run in Supabase SQL Editor. Updates only feature tickets to correct company.
-- ============================================================================

-- FE-0001 through FE-0107 → Demo_c (all others below get overridden by later UPDATEs)
UPDATE public.tickets SET company_name = 'Demo_c' WHERE type = 'feature' AND reference_no IN (
  'FE-0001','FE-0002','FE-0003','FE-0004','FE-0005','FE-0006','FE-0007','FE-0008','FE-0009','FE-0010',
  'FE-0011','FE-0012','FE-0013','FE-0014','FE-0015','FE-0016','FE-0017','FE-0018','FE-0019','FE-0020',
  'FE-0021','FE-0022','FE-0023','FE-0024','FE-0025','FE-0026','FE-0027','FE-0028','FE-0029','FE-0030',
  'FE-0031','FE-0032','FE-0033','FE-0034','FE-0035','FE-0036','FE-0037','FE-0038','FE-0039','FE-0040',
  'FE-0041','FE-0042','FE-0043','FE-0044','FE-0045','FE-0046','FE-0047','FE-0048','FE-0049','FE-0050',
  'FE-0051','FE-0052','FE-0053','FE-0054','FE-0055','FE-0056','FE-0057','FE-0058','FE-0059','FE-0060',
  'FE-0061','FE-0062','FE-0063','FE-0064','FE-0065','FE-0066','FE-0067','FE-0068','FE-0069','FE-0070',
  'FE-0071','FE-0072','FE-0073','FE-0074','FE-0075','FE-0076','FE-0077','FE-0078','FE-0079','FE-0080',
  'FE-0081','FE-0082','FE-0083','FE-0084','FE-0085','FE-0086','FE-0087','FE-0088','FE-0089','FE-0090',
  'FE-0091','FE-0092','FE-0093','FE-0094','FE-0095','FE-0096','FE-0097','FE-0098','FE-0099','FE-0100',
  'FE-0101','FE-0102','FE-0103','FE-0104','FE-0105','FE-0106','FE-0107'
);

-- Overrides: specific company per FE reference (order does not matter)
UPDATE public.tickets SET company_name = 'Nutan Ispat & Power Pvt Ltd' WHERE reference_no IN ('FE-0129','FE-0130','FE-0131','FE-0132','FE-0133','FE-0134','FE-0135','FE-0136','FE-0137','FE-0138','FE-0139','FE-0140','FE-0141','FE-0147','FE-0153','FE-0154');
UPDATE public.tickets SET company_name = 'Hariom Ingots & Power Pvt. Ltd.' WHERE reference_no IN ('FE-0143');
UPDATE public.tickets SET company_name = 'Odissa Concrete & Allied Industries Ltd' WHERE reference_no IN ('FE-0145','FE-0215');
UPDATE public.tickets SET company_name = 'Dadijee Steel Manufacturing & Trading Private Limited' WHERE reference_no IN ('FE-0146');
UPDATE public.tickets SET company_name = 'Spintech Tubes Pvt Ltd' WHERE reference_no IN ('FE-0152');
UPDATE public.tickets SET company_name = 'MVK Industries Pvt Ltd' WHERE reference_no IN ('FE-0158','FE-0173');
UPDATE public.tickets SET company_name = 'Agroha Steel and Power Pvt Ltd' WHERE reference_no IN ('FE-0156');
UPDATE public.tickets SET company_name = 'Rashmi Sponge Iron & Power Industries Pvt. Limited' WHERE reference_no IN ('FE-0159');
UPDATE public.tickets SET company_name = 'Rausheena Udyog Limited' WHERE reference_no IN ('FE-0160');
UPDATE public.tickets SET company_name = 'Maanheruka' WHERE reference_no IN ('FE-0161','FE-0162','FE-0163');
UPDATE public.tickets SET company_name = 'Sky Alloys and Power Limited' WHERE reference_no IN ('FE-0164','FE-0178','FE-0216');
UPDATE public.tickets SET company_name = 'Balmukund Sponge Iron Pvt. Ltd.' WHERE reference_no IN ('FE-0166','FE-0167','FE-0169','FE-0185');
UPDATE public.tickets SET company_name = 'Roopgarh Power & Alloys Pvt. Ltd' WHERE reference_no IN ('FE-0177');
UPDATE public.tickets SET company_name = 'Brahmaputra Metallics Ltd.' WHERE reference_no IN ('FE-0176');
UPDATE public.tickets SET company_name = 'B.R.Sponge & Power Ltd.' WHERE reference_no IN ('FE-0182');
UPDATE public.tickets SET company_name = 'BlackRock Steel & Power Pvt. Ltd' WHERE reference_no IN ('FE-0184','FE-0186');
UPDATE public.tickets SET company_name = 'BR Group' WHERE reference_no IN ('FE-0189');
UPDATE public.tickets SET company_name = 'Hi-Tech Power & Steel Ltd.' WHERE reference_no IN ('FE-0180','FE-0190');
UPDATE public.tickets SET company_name = 'Bharat Hi-Tech (Cements) Pvt. Ltd' WHERE reference_no IN ('FE-0183');
UPDATE public.tickets SET company_name = 'BIHAR FOUNDRY' WHERE reference_no IN ('FE-0191','FE-0192','FE-0195','FE-0196','FE-0197','FE-0198','FE-0199','FE-0200','FE-0201','FE-0202','FE-0203','FE-0204','FE-0206','FE-0207','FE-0208','FE-0209','FE-0210','FE-0211');
UPDATE public.tickets SET company_name = 'Flexicom Industries Pvt. Ltd.' WHERE reference_no IN ('FE-0193');
UPDATE public.tickets SET company_name = 'KSK Engineering Industries Pvt Ltd' WHERE reference_no IN ('FE-0212','FE-0214');
UPDATE public.tickets SET company_name = 'Bhagwati Power Pvt. Ltd.' WHERE reference_no IN ('FE-0213','FE-0217','FE-0218');

-- Optional: set any remaining FE tickets (not in lists above) to Demo_c
-- UPDATE public.tickets SET company_name = 'Demo_c' WHERE type = 'feature' AND reference_no ~ '^FE-[0-9]+$' AND (company_name IS NULL OR company_name = '');
