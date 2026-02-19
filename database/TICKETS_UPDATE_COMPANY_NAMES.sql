-- Fix Company Name and Page for existing tickets (run once if you already inserted with NULL company_name / page_id)
-- Updates tickets.company_name so the UI shows the correct company.
-- Updates tickets.page_id from public.pages so the UI shows the correct page name.
-- Matches reference_no from TICKETS_BULK_INSERT_PENDING_AND_HOLD.sql (BU-0001, CH-0009, etc.).
-- Requires: public.pages table populated with id and name (same names as in tickets.page).

UPDATE public.tickets SET company_name = 'Demo_c' WHERE reference_no IN (
  'BU-0001','BU-0002','CH-0001','CH-0009','CH-0011','CH-0018','CH-0021','CH-0025','CH-0026','CH-0036','CH-0037','CH-0041','CH-0042','CH-0044','CH-0046','CH-0047','CH-0049','CH-0050','CH-0058','BU-0011','CH-0097','CH-0108','CH-0109','CH-0110','CH-0111','CH-0113','CH-0114','CH-0115','CH-0116','CH-0117','BU-0014','CH-0396','CH-0964','CH-0965','CH-1006','CH-1029','CH-1030','CH-1046','CH-1085','CH-1092','CH-1093','CH-1094','CH-1095','CH-1096','CH-1097','CH-1098','CH-1099','CH-1100','CH-1101','CH-1102','CH-1103','CH-1181','BU-0079','CH-0914','BU-0101','CH-0952','CH-0954','CH-0955','CH-0962','CH-1224','FE-0142','FE-0144','FE-0148','FE-0149','FE-0150','FE-0151','FE-0155','FE-0157','FE-0165','FE-0168','FE-0170','FE-0171','FE-0172','FE-0174','FE-0175','FE-0179','FE-0181','FE-0187','FE-0188','FE-0194','FE-0205'
);
UPDATE public.tickets SET company_name = 'Ghankun Steel Pvt Ltd (SMS Division)' WHERE reference_no = 'CH-0336';
UPDATE public.tickets SET company_name = 'Crescent Foundry' WHERE reference_no = 'CH-0365';
UPDATE public.tickets SET company_name = 'Kodarma Chemical Pvt. Ltd.' WHERE reference_no IN ('CH-0474','CH-0778','CH-0792','CH-1135');
UPDATE public.tickets SET company_name = 'Nirmaan TMT' WHERE reference_no IN ('CH-0594','CH-0943','CH-1222');
UPDATE public.tickets SET company_name = 'Spintech Tubes Pvt Ltd' WHERE reference_no IN ('CH-0626','FE-0152');
UPDATE public.tickets SET company_name = 'Indo East Corporation Private Limited' WHERE reference_no IN ('CH-0797','CH-0795');
UPDATE public.tickets SET company_name = 'Karnikripa Power Pvt Ltd' WHERE reference_no IN ('CH-0818','BU-0138','CH-0698','CH-0784');
UPDATE public.tickets SET company_name = 'BIHAR FOUNDRY' WHERE reference_no IN ('CH-0982','CH-1067','CH-1069','BU-0131','CH-1147','CH-1148','CH-1177','CH-1218','CH-0983','CH-0984','CH-0987','CH-0988','CH-1070','CH-1122','CH-1167','CH-1179','FE-0191','FE-0192','FE-0195','FE-0196','FE-0197','FE-0198','FE-0199','FE-0200','FE-0201','FE-0202','FE-0203','FE-0204','FE-0206','FE-0207','FE-0208','FE-0209','FE-0210','FE-0211');
UPDATE public.tickets SET company_name = 'Flexicom Industries Pvt. Ltd.' WHERE reference_no IN ('BU-0104','FE-0193');
UPDATE public.tickets SET company_name = 'Bhagwati Power Pvt. Ltd.' WHERE reference_no IN ('CH-1230','CH-1231','CH-1232','CH-1233','CH-1234','CH-1239','FE-0213','FE-0217','FE-0218');
UPDATE public.tickets SET company_name = 'Balmukund Sponge Iron Pvt. Ltd.' WHERE reference_no IN ('CH-0499','CH-0500','CH-1245','FE-0166','FE-0167','FE-0169','FE-0185');
UPDATE public.tickets SET company_name = 'Mangal Sponge and Steel Pvt. Ltd.' WHERE reference_no = 'CH-0527';
UPDATE public.tickets SET company_name = 'Bharat Hi-Tech (Cements) Pvt. Ltd' WHERE reference_no IN ('CH-0607','CH-0608','FE-0183');
UPDATE public.tickets SET company_name = 'M/s. Singhal Enterprises (Jharsuguda) Pvt. Ltd' WHERE reference_no IN ('CH-0788','CH-1110');
UPDATE public.tickets SET company_name = 'Ugen Ferro Alloys Pvt. Ltd.' WHERE reference_no = 'CH-0791';
UPDATE public.tickets SET company_name = 'Hi-Tech Power & Steel Ltd.' WHERE reference_no IN ('CH-0861','CH-0879','CH-0929','CH-1144','FE-0180','FE-0190');
UPDATE public.tickets SET company_name = 'Odissa Concrete & Allied Industries Ltd' WHERE reference_no IN ('CH-1242','FE-0145','FE-0215');
UPDATE public.tickets SET company_name = 'Agroha Steel and Power Pvt Ltd' WHERE reference_no IN ('FE-0156');
UPDATE public.tickets SET company_name = 'B.R.Sponge & Power Ltd.' WHERE reference_no IN ('FE-0182');
UPDATE public.tickets SET company_name = 'BR Group' WHERE reference_no IN ('FE-0189');
UPDATE public.tickets SET company_name = 'BlackRock Steel & Power Pvt. Ltd' WHERE reference_no IN ('FE-0184','FE-0186');
UPDATE public.tickets SET company_name = 'Brahmaputra Metallics Ltd.' WHERE reference_no IN ('FE-0176');
UPDATE public.tickets SET company_name = 'Dadijee Steel Manufacturing & Trading Private Limited' WHERE reference_no IN ('FE-0146');
UPDATE public.tickets SET company_name = 'Hariom Ingots & Power Pvt. Ltd.' WHERE reference_no IN ('FE-0143');
UPDATE public.tickets SET company_name = 'KSK Engineering Industries Pvt Ltd' WHERE reference_no IN ('FE-0212','FE-0214');
UPDATE public.tickets SET company_name = 'MVK Industries Pvt Ltd' WHERE reference_no IN ('FE-0158','FE-0173');
UPDATE public.tickets SET company_name = 'Maanheruka' WHERE reference_no IN ('FE-0161','FE-0162','FE-0163');
UPDATE public.tickets SET company_name = 'Nutan Ispat & Power Pvt Ltd' WHERE reference_no IN ('FE-0129','FE-0130','FE-0131','FE-0132','FE-0133','FE-0134','FE-0135','FE-0136','FE-0137','FE-0138','FE-0139','FE-0140','FE-0141','FE-0147','FE-0153','FE-0154');
UPDATE public.tickets SET company_name = 'Rashmi Sponge Iron & Power Industries Pvt. Limited' WHERE reference_no IN ('FE-0159');
UPDATE public.tickets SET company_name = 'Rausheena Udyog Limited' WHERE reference_no IN ('FE-0160');
UPDATE public.tickets SET company_name = 'Roopgarh Power & Alloys Pvt. Ltd' WHERE reference_no IN ('FE-0177');
UPDATE public.tickets SET company_name = 'Sky Alloys and Power Limited' WHERE reference_no IN ('FE-0164','FE-0178','FE-0216');

-- Set page_id from public.pages so Page name is visible in UI (join by page name)
UPDATE public.tickets t SET page_id = p.id FROM public.pages p WHERE p.name = t.page AND t.page IS NOT NULL;
