-- Bulk INSERT for support_tickets (generated). Run in Supabase after SUPPORT_TICKETS_TABLE.sql
-- Delete sample rows first if you already ran SUPPORT_TICKETS_MIGRATION.sql:
-- DELETE FROM public.support_tickets WHERE response_source = 'upload';

BEGIN;
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'BU-0001',
  'Showing POP Up to select Item, when already selected. In Pending PO GRN when one item is already selected, we are going to make an GRN, pop up showing as "Please select an item." Original Ref: BU-0001',
  'Pending',
  'Pending',
  '2024-11-08 14:48:07+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Showing POP Up to select Item, when already selected',
  'Bugs',
  'Pending PO (GRN)',
  'Demo_c',
  'Shreyasi',
  '2024-11-08 14:48:07+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'BU-0002',
  'Reorder Level add. When creating an item reorder level, we can add multiple entries for a single division, which is not necessary. In Demo_C, we have three divisions, so we should only be able to add one entry per division. However, currently, it allows adding multiple entries for the same division at once. Original Ref: BU-0002',
  'Pending',
  'Pending',
  '2024-11-08 14:51:07+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Reorder Level add',
  'Bugs',
  'ITEM',
  'Demo_c',
  'Rimpa',
  '2024-11-08 14:51:07+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0001',
  'Attachment file not cancel by single click. When we attached one file on creating Indent, then add another attachment click after that we can not remove it clicking cross sign on first click 2 times clicking then the another file is remove Original Ref: CH-0001',
  'Pending',
  'Pending',
  '2024-11-09 14:53:05+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Attachment file not cancel by single click',
  'Chores',
  'Create Indent',
  'Demo_c',
  'Rimpa',
  '2024-11-09 14:53:05+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0009',
  'Location column should be added in Stock Adjustment Aprroval. Original Ref: CH-0009',
  'Pending',
  'Pending',
  '2024-12-06 15:13:59+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Location column should be added in Stock Adjustment Aprroval',
  'Chores',
  'Stock Adjustment Approvals',
  'Demo_c',
  'Rimpa',
  '2024-12-06 15:13:59+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0011',
  'There should be an option to choose a location.. On the "Issue Tools on Returnable Basis" page, there should be an option to choose the location. Otherwise, users will have to update the location repeatedly on the Item Stock page after returning the items. Original Ref: CH-0011',
  'Pending',
  'Pending',
  '2024-12-09 15:18:05+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'There should be an option to choose a location.',
  'Chores',
  'Issue Tools on Returnable Basis',
  'Demo_c',
  'Rimpa',
  '2024-12-09 15:18:05+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0018',
  'Tag to Repair--> option to choose quantity. There is no option to choose a specific quantity. If an item has 3 quantities, and we want to tag 1 quantity for repair and 2 quantities for scrap, there should be an option to do so. Original Ref: CH-0018',
  'Pending',
  'Pending',
  '2024-12-17 15:38:00+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Tag to Repair--> option to choose quantity',
  'Chores',
  'Items Pending to be sent for repair',
  'Demo_c',
  'Rimpa',
  '2024-12-17 15:38:00+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0021',
  'Sometimes item for repair divided in three part, sent for repair, scrap, remaining. The system should behave correctly when an item is pending for repair. For a total quantity of 10, with 2 sent for repair, 6 marked as scrap, and 2 remaining, all information should be accurately reflected. Original Ref: CH-0021',
  'Pending',
  'Pending',
  '2024-12-17 15:42:41+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Sometimes item for repair divided in three part, sent for repair, scrap, remaining',
  'Chores',
  'Items Pending to be sent for repair',
  'Demo_c',
  'Rimpa',
  '2024-12-17 15:42:41+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0025',
  'If the indenter provides an attachment in work order indent , and the purchaser wants to send that attachment to the vendor or add any additional attachment, same as the PO, but no attachment could not be sent to the vendor. "(Work Order)". Original Ref: CH-0025',
  'Pending',
  'Pending',
  '2024-12-24 15:48:48+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'If the indenter provides an attachment in work order indent , and the purchaser wants to send that attachment to the vendor or add any additional attachment, same as the PO, but no attachment could not be sent to the vendor. "(Work Order)"',
  'Chores',
  'Vendor Quote',
  'Demo_c',
  'Aman',
  '2024-12-24 15:48:48+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0026',
  'Rate is not showing on WRN entry page.. Original Ref: CH-0026',
  'Pending',
  'Pending',
  '2024-12-24 15:50:33+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Rate is not showing on WRN entry page.',
  'Chores',
  'WRN Entry',
  'Demo_c',
  'Aman',
  '2024-12-24 15:50:33+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0036',
  'Problem in creating Work Order Indent. "When entering a single WO Indent as input, if the quantity field is left blank or set to zero, a proper message appears just under the quantity box stating ""Invalid qty."" However, the following issues occur when providing multiple inputs in a single WO Indent: 1. If the first input in the WO Indent is filled correctly with all fields, but the quantity field is filled incorrectly for subsequent inputs, an error message appears stating ""Something went wrong."" 2. If the first input in the WO Indent has an incorrect quantity, is blank, or is set to zero, and all subsequent inputs are filled correctly, the message ""Invalid qty"" appears under the quantity box for all inputs in that WO Indent, including both the incorrectly and correctly filled inputs." Original Ref: CH-0036',
  'Pending',
  'Pending',
  '2025-01-22 13:26:11+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Problem in creating Work Order Indent',
  'Chores',
  'Create Wo Indent',
  'Demo_c',
  'Rimpa',
  '2025-01-22 13:26:11+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0037',
  'Problem in creating Work Order Indent. If we create a WO Indent with a blank title, the *Create* button does not work. However, no message is displayed under the title box, such as "Invalid input," "This field is mandatory," or "Please provide input using A-Z, a-z, or 0-9." Original Ref: CH-0037',
  'Pending',
  'Pending',
  '2025-01-22 13:49:40+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Problem in creating Work Order Indent',
  'Chores',
  'Create Wo Indent',
  'Demo_c',
  'Rimpa',
  '2025-01-22 13:49:40+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0041',
  'Pending WO Indent RFQ page -->Description filter. "The Description filter is providing an extra option, labeled as ""blank."" If we select ""blank"" as a filter option, it does not return the correct results. Additionally, if we select any specific item or multiple options from the filter without choosing ""blank,"" after applying the filter, it automatically selects the ""blank"" option as an extra filter. However, the search results display only the items intentionally selected in the filter. (Refer to the attached video titled ""Pending WO Indent Description Filter Glitch"" for a detailed demonstration.)" Original Ref: CH-0041',
  'Pending',
  'Pending',
  '2025-01-22 17:52:04+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Pending WO Indent RFQ page -->Description filter',
  'Chores',
  'Pending Work Order Indent RFQ',
  'Demo_c',
  'Rimpa',
  '2025-01-22 17:52:04+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0042',
  'Pending WO Indent RFQ page -->Requester filter. The filter options for the *Requester* column are being displayed repeatedly. For example, "Demo endUser" is an Indenter in our system across all divisions. When filtering by the requester name "Demo endUser," it should display all search results requested by this user. However, the filter is showing multiple options with the same name. One option reflects all search results for this requester, while other options with the same name display division-wise search results. Original Ref: CH-0042',
  'Pending',
  'Pending',
  '2025-01-23 11:24:28+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Pending WO Indent RFQ page -->Requester filter',
  'Chores',
  'Pending Work Order Indent RFQ',
  'Demo_c',
  'Rimpa',
  '2025-01-23 11:24:28+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0044',
  'Whatsapp message after vendor submitted quotation is wholly wrong. For WORFQ, after furnishing the RFQ, the purchaser should receive a message stating, "Quote furnished by ...". Instead, the vendor is receiving this message. Additionally, the message displays "WORFQ/" without showing the RFQ serial number after the slash (/), which should be corrected to include the serial number. Original Ref: CH-0044',
  'Pending',
  'Pending',
  '2025-01-23 12:25:16+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Whatsapp message after vendor submitted quotation is wholly wrong',
  'Chores',
  'Vendor Quote',
  'Demo_c',
  'Rimpa',
  '2025-01-23 12:25:16+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0046',
  'Pending WO Indent RFQ page. On the Pending WO Indents page, an RFQ was first sent to Vendor A with RFQ number WORFQ/93, which is displayed on this page. Subsequently, a WO was created for Vendor B for the same Work Order Indent WOIND/24-25/00054, with RFQ number WORFQ/94, but it is not appearing in the pending list. For Work Order Indent WOIND/24-25/00054 in DemoWarehouse, it shows "under vendors 0/2", and when clicked, it displays only Vendor A and indicates that Vendor B has not quoted. However, a WO has already been created for Vendor B, and it is still pending approval. Original Ref: CH-0046',
  'Pending',
  'Pending',
  '2025-01-23 13:40:44+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Pending WO Indent RFQ page',
  'Chores',
  'Pending Work Order Indent RFQ',
  'Demo_c',
  'Rimpa',
  '2025-01-23 13:40:44+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0047',
  'Pending WO Indent RFQ page. The first time we sent WORFQ to Vendor A, WORFQ/95 was successfully sent. However, when we attempted to send WORFQ to the same vendor a second time, it was also successfully sent with the same WORFQ/95. Ideally, the system should notify that WORFQ/95 has already been sent to Vendor A. Original Ref: CH-0047',
  'Pending',
  'Pending',
  '2025-01-23 13:45:05+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Pending WO Indent RFQ page',
  'Chores',
  'Pending Work Order Indent RFQ',
  'Demo_c',
  'Rimpa',
  '2025-01-23 13:45:05+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0049',
  'WRN entry--> Qty.. When creating a WRN, if the WRN quantity is set to 0, the WRN preview incorrectly shows 1 quantity. However, upon confirmation, an error message appears stating "Something went wrong." Instead, the system should display an error message in the WRN stating "Invalid quantity" when 0 quantity is entered. Original Ref: CH-0049',
  'Pending',
  'Pending',
  '2025-01-23 13:49:07+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'WRN entry--> Qty.',
  'Chores',
  'WRN Entry',
  'Demo_c',
  'Rimpa',
  '2025-01-23 13:49:07+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0050',
  'WRN entry--> Qty.. When creating a WRN, if the input WRN quantity exceeds the WO quantity and the WRN Preview button is clicked, the button works, but the WRN preview is not displayed due to the incorrect quantity. Instead, the system should display an error message indicating the quantity is invalid or exceeds the WO quantity. Original Ref: CH-0050',
  'Pending',
  'Pending',
  '2025-01-23 13:52:03+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'WRN entry--> Qty.',
  'Chores',
  'WRN Entry',
  'Demo_c',
  'Rimpa',
  '2025-01-23 13:52:03+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0058',
  'Link for Quote functioning different in Whatsapp and Email(Same like FMS 13). The vendor received a reminder message for a quote via WhatsApp and email after the WO RFQ. When the vendor clicks the link to submit a quote from WhatsApp, it shows the message "PO already made for this RFQ." However, when the same link is accessed through email, the vendor can submit their quote. Original Ref: CH-0058',
  'Pending',
  'Pending',
  '2025-01-24 09:35:36+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Link for Quote functioning different in Whatsapp and Email(Same like FMS 13)',
  'Chores',
  'Whatsapp IndustryPrime',
  'Demo_c',
  'Rimpa',
  '2025-01-24 09:35:36+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'BU-0011',
  'When creating a manual quote or when the vendor is quoting, if user copy the previous quote, the previous price gets included in the HSN Code.. Original Ref: BU-0011',
  'Pending',
  'Pending',
  '2025-02-05 10:16:20+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'When creating a manual quote or when the vendor is quoting, if user copy the previous quote, the previous price gets included in the HSN Code.',
  'Bugs',
  'Vendor Quote',
  'Demo_c',
  'Aman',
  '2025-02-05 10:16:20+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0097',
  'Boundation should be applied on date range. "Stockledger date range choose- start date 1/1/2026  end date 6/2/2025 report received in mail there should be bounde the date range and not choose the future date " Original Ref: CH-0097',
  'Pending',
  'Pending',
  '2025-02-06 10:45:26+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Boundation should be applied on date range',
  'Chores',
  'Stock Ledger',
  'Demo_c',
  'Rimpa',
  '2025-02-06 10:45:26+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0108',
  'Setup--> Make--> Blank field save. A blank field has been saved under Make, but it is not appearing in the list. Original Ref: CH-0108',
  'Pending',
  'Pending',
  '2025-02-07 12:32:45+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Setup--> Make--> Blank field save',
  'Chores',
  'Set Up',
  'Demo_c',
  'Rimpa',
  '2025-02-07 12:32:45+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0109',
  'Style and functionality are not working properly.. In the page of item Group wise consumption the view of whole page is not correct like setup, transaction, etc. positions, under this user end view is Blank. in the left most corner if we chose any division it''s not showing and if we click on excel export the report is only contain two word Item Group & Amount . Original Ref: CH-0109',
  'Pending',
  'Pending',
  '2025-02-07 12:44:26+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Style and functionality are not working properly.',
  'Chores',
  'Item Group Wise Consumption',
  'Demo_c',
  'Aman',
  '2025-02-07 12:44:26+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0110',
  'Setup--> Cat no--> Blank field save. A blank field has been saved under Cat no, and also showing in catalogue list Original Ref: CH-0110',
  'Pending',
  'Pending',
  '2025-02-07 12:45:11+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Setup--> Cat no--> Blank field save',
  'Chores',
  'Set Up',
  'Demo_c',
  'Rimpa',
  '2025-02-07 12:45:11+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0111',
  'notification--> RGP--> 0 qty accepted for return but it is still pending on RGP. Original Ref: CH-0111',
  'Pending',
  'Pending',
  '2025-02-07 12:47:57+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'notification--> RGP--> 0 qty accepted for return but it is still pending on RGP',
  'Chores',
  'Returnable Gate Pass',
  'Demo_c',
  'Rimpa',
  '2025-02-07 12:47:57+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0113',
  'Create Indent--> Item Name. "When taking input as ""No Existing Match"" in the field and clicking the Create Indent button: - The button is working, but the Indent is not being created. - No popup or message is displayed for the ""No Existing Match"" item name. - The same issue occurs when adding another item with correct details while one item has ""No Existing Match""—the indent is still not created." Original Ref: CH-0113',
  'Pending',
  'Pending',
  '2025-02-07 12:52:58+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Create Indent--> Item Name',
  'Chores',
  'Create Indent',
  'Demo_c',
  'Rimpa',
  '2025-02-07 12:52:58+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0114',
  'GRN entry--> accepted qty & rejected qty. "If we enter Accepted Qty as ""-2"" and Rejected Qty as ""0"": - The system still shows the GRN preview. - When clicking Confirm, it moves to the Pending PO GRN page. - However, the GRN is not created and an error message appears: ""Give appropriate qty.""" Original Ref: CH-0114',
  'Pending',
  'Pending',
  '2025-02-07 13:01:22+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'GRN entry--> accepted qty & rejected qty',
  'Chores',
  'GRN Entry',
  'Demo_c',
  'Rimpa',
  '2025-02-07 13:01:22+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0115',
  'GRN entry--> accepted qty & rejected qty. "If we enter Accepted Qty as a negative value and the quantity exceeds the PO Qty, while keeping Rejected Qty as ""0"": - The system still shows the GRN preview, even though the input is incorrect. - When clicking Confirm, it moves to the Pending PO GRN page. - However, the GRN is not created and an error message appears: ""Give appropriate qty."" This indicates that the system allows an incorrect preview but prevents the final creation of the GRN due to invalid quantities." Original Ref: CH-0115',
  'Pending',
  'Pending',
  '2025-02-07 13:04:20+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'GRN entry--> accepted qty & rejected qty',
  'Chores',
  'GRN Entry',
  'Demo_c',
  'Rimpa',
  '2025-02-07 13:04:20+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0116',
  'WRN entry--> accepted qty. "If we enter 0 in the Accepted Qty field: - The system still shows the GRN preview, even though the input is invalid. - When clicking Confirm, an error message appears: ""Something went wrong."" - The GRN is not created, but the system does not provide a clear reason for the failure. This suggests that the system should ideally validate the Accepted Qty before showing the preview and provide a more specific error message." Original Ref: CH-0116',
  'Pending',
  'Pending',
  '2025-02-07 13:06:34+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'WRN entry--> accepted qty',
  'Chores',
  'WRN Entry',
  'Demo_c',
  'Rimpa',
  '2025-02-07 13:06:34+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0117',
  'Items pending to be sent for repair--> tag to scrap. "Currently, when items pending to be sent for repair are tagged to scrap, the system allows the item to be added to the Scrap Register even if Scrap Weight and Scrap Qty are not provided. Note: The system should not allow the item to be added to the Scrap Register unless both Scrap Weight and Scrap Qty are entered. Instead, it should prompt an error message requesting the missing input." Original Ref: CH-0117',
  'Pending',
  'Pending',
  '2025-02-07 13:08:48+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Items pending to be sent for repair--> tag to scrap',
  'Chores',
  'Items Pending to be sent for repair',
  'Demo_c',
  'Rimpa',
  '2025-02-07 13:08:48+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'BU-0014',
  'When increasing the quantity on the approval page.. If we issue a quantity of 1 for a repairable item, and before approval, the quantity on the site increases to 3, then when we send it for repair using the Tag To Repair option, But in the Returnable Items Not Yet Received section still shows the quantity as 1, indicating that it has been sent for repair. Original Ref: BU-0014',
  'Pending',
  'Pending',
  '2025-02-10 11:30:45+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'When increasing the quantity on the approval page.',
  'Bugs',
  'Returnable Items Not Yet Received',
  'Demo_c',
  'Aman',
  '2025-02-10 11:30:45+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0336',
  'Change the company name. "Change the company name from Ghankun Steel Pvt. Ltd. (SMS Division) to Ghankun Steel Melting Pvt. Ltd. Date change from 22/04/2025 only change company name division will be SMS. For other details see the attachment " Original Ref: CH-0336',
  'Pending',
  'Pending',
  '2025-04-23 13:39:19+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Change the company name',
  'Chores',
  'Dashboard',
  'Ghankun Steel Pvt Ltd (SMS Division)',
  'Rimpa',
  '2025-04-23 13:39:19+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0365',
  'Rearrange the report highest to lowest. In the report Company Wise Approved Quotes all the Qty, Amount, Avg rate should be reflect from highest to lowest. Original Ref: CH-0365',
  'Pending',
  'Pending',
  '2025-05-03 09:56:24+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Rearrange the report highest to lowest',
  'Chores',
  'Company Wise Approved Quotes',
  'Crescent Foundry',
  'Rimpa',
  '2025-05-03 09:56:24+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0396',
  'Error PopUp. When we do not select on vendor (L1) and tap on create PO, it does not create PO which is fine but user is unable to figure out why it is not happening since a message like "Please select the vendor" is not popping up Original Ref: CH-0396',
  'Pending',
  'Pending',
  '2025-05-13 10:15:49+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Error PopUp',
  'Chores',
  'Quotation Comparison',
  'Demo_c',
  'Aman',
  '2025-05-13 10:15:49+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0474',
  'Change contact details in PO. In Purchase Order showing Contact name- Suchitra Sahoo and Phone- 9348728262 instead of any user details. Basically any user create PO but showing only her contact details in Purchase Order. Original Ref: CH-0474',
  'Pending',
  'Pending',
  '2025-06-02 13:46:30+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Change contact details in PO',
  'Chores',
  'PO Register',
  'Kodarma Chemical Pvt. Ltd.',
  'Rimpa',
  '2025-06-02 13:46:30+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0491',
  'WRN Qty. edit problem. "When increasing the quantity in WRN entry, the system only shows a buffering icon without any proper message or action. A clear validation message should be displayed. If quantity is entered as zero during WRN creation, a proper validation message should appear instead of a showing error." Original Ref: CH-0491',
  'Pending',
  'Pending',
  '2025-06-06 10:25:17+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'WRN Qty. edit problem',
  'Chores',
  'WRN Entry',
  'Demo_c',
  'Rimpa',
  '2025-06-06 10:25:17+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0492',
  'Indenter column with filter and status column with filter & trail should be added for better tracking.. Original Ref: CH-0492',
  'Pending',
  'Pending',
  '2025-06-06 10:26:55+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Indenter column with filter and status column with filter & trail should be added for better tracking.',
  'Chores',
  'WRN Register',
  'Demo_c',
  'Rimpa',
  '2025-06-06 10:26:55+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0493',
  'WRN edit page. "Notification → WRN Approval → Action → WRN Edit→ After updating the WRN, the system only shows a buffering icon and does not redirect. It should redirect back to the WRN approval page after saving. Also, WRN edit page is functioning correctly, but the page title currently shows ""GRN Edit"" instead of ""WRN Edit."" This should be corrected for clarity." Original Ref: CH-0493',
  'Pending',
  'Pending',
  '2025-06-06 10:29:03+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'WRN edit page',
  'Chores',
  'WRN Entry',
  'Demo_c',
  'Rimpa',
  '2025-06-06 10:29:03+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0594',
  'Purchase order view and item stock options should be visible in the gate entry person''s [redacted-email]. Original Ref: CH-0594',
  'Pending',
  'Pending',
  '2025-07-11 12:10:35+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Purchase order view and item stock options should be visible in the gate entry person''s [redacted-email]',
  'Chores',
  'Dashboard',
  'Nirmaan TMT',
  'Shreyasi',
  '2025-07-11 12:10:35+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0626',
  'Add Payment term column with filter in PO register. Add Payment term column with filter in PO register and also it will be present in Export option. Original Ref: CH-0626',
  'Pending',
  'Pending',
  '2025-07-22 17:23:37+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add Payment term column with filter in PO register',
  'Chores',
  'PO Register',
  'Spintech Tubes Pvt Ltd',
  'Rimpa',
  '2025-07-22 17:23:37+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0797',
  'Add an "Other" option to the payment mode list in the payment sheet (if they pay via credit card or any other mode). Original Ref: CH-0797',
  'Pending',
  'Pending',
  '2025-09-20 12:21:56+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add an "Other" option to the payment mode list in the payment sheet (if they pay via credit card or any other mode)',
  'Chores',
  'Payment Sheet',
  'Indo East Corporation Private Limited',
  'Rimpa',
  '2025-09-20 12:21:56+00'::TIMESTAMPTZ,
  NULL
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0818',
  'WO preview not showing total amount with GST. While creating a Work Order, the preview should show the total amount including GST. Original Ref: CH-0818',
  'Pending',
  'Pending',
  '2025-10-03 10:49:11+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'WO preview not showing total amount with GST',
  'Chores',
  'Create Wo',
  'Karnikripa Power Pvt Ltd',
  'Rimpa',
  '2025-10-02 15:57:00+00'::TIMESTAMPTZ,
  '2025-10-03 10:45:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0964',
  'After clicking on approval it redirect user to the old UI/UX. On the Brand Approval page, after approving a brand, the page is supposed to refresh and load the updated UI/UX. However, after approval, it is redirecting back to the old UI/UX instead of the updated one. Original Ref: CH-0964',
  'Pending',
  'Pending',
  '2025-11-29 13:06:03+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'After clicking on approval it redirect user to the old UI/UX',
  'Chores',
  'Approvals',
  'Demo_c',
  'Rimpa',
  '2025-11-29 11:00:00+00'::TIMESTAMPTZ,
  '2025-11-29 11:00:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0965',
  'Item tag created without approval. "Unapproved vendor tags--> Click on show all item tags--> Redirect to all item tags--> Click on new item tags--> Input details --> Creating the Item tag without approval (that is wrong) Unapproved vendor tags--> Click on item tag--> Unapproved item tags under vendor tags page--> Click on approve--> After input all the details going for approval  (that is correct)" Original Ref: CH-0965',
  'Pending',
  'Pending',
  '2025-11-29 13:13:10+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Item tag created without approval',
  'Chores',
  'Approvals',
  'Demo_c',
  'Rimpa',
  '2025-11-29 11:00:00+00'::TIMESTAMPTZ,
  '2025-11-29 11:00:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-0982',
  'Add filter in Bill Register for GRN & Bill Numbers. Original Ref: CH-0982',
  'Pending',
  'Pending',
  '2025-12-04 12:18:10+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add filter in Bill Register for GRN & Bill Numbers',
  'Chores',
  'Bill Register',
  'BIHAR FOUNDRY',
  'Shreyasi',
  '2025-11-20 09:38:00+00'::TIMESTAMPTZ,
  '2025-11-20 09:38:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'BU-0104',
  'QC page problem. "Indent no- INDFLX/25-26/00471 RFQ no- RFQ 1269 Item name- 1. Roller Water Bath 2000 For Tape Plant Use Down Unit Oem Code 11202692020 Vendor- Lohia Corp 2. Roller Water Bath 2000 Tape Plant For Top Unit Oem Code 11203866020 3. Air Filter Inner Assembly For Dosing Unit OF Tape Line -Part Code P500806 - P500807- Make- DONALDSON- Oem-Prashad Koch-1000507031 it is showing that RFQ already sent to the vendor but when user edit quote item not showing" Original Ref: BU-0104',
  'Pending',
  'Pending',
  '2025-12-05 10:37:41+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'QC page problem',
  'Bugs',
  'Quotation Comparison',
  'Flexicom Industries Pvt. Ltd.',
  'Shreyasi',
  '2025-12-05 10:17:00+00'::TIMESTAMPTZ,
  '2025-12-05 10:26:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1006',
  'Production Register to Stock Ledger. In the Production Register to Stock Ledger, there is no link between the Production Number and the slip. In our Demo, when we click on a GRN No or PO No, the corresponding slip opens directly. We need the same functionality here — clicking on the Production Number should open the Production slip. Original Ref: CH-1006',
  'Pending',
  'Pending',
  '2025-12-10 14:39:25+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Production Register to Stock Ledger',
  'Chores',
  'EMS Dashboard',
  'Demo_c',
  'Rimpa',
  '2025-12-10 14:24:00+00'::TIMESTAMPTZ,
  '2025-12-10 14:24:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1029',
  'Enable a remark option for Issue approval and unapproval. Enable a remark option for Issue approval and unapproval, so that approvers can approve or unapprove an Issue with a remark. The remark should be visible on the Issue slip under "Approved by" or "Unapproved by," along with the respective remarks. Original Ref: CH-1029',
  'Pending',
  'Pending',
  '2025-12-16 09:57:23+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Enable a remark option for Issue approval and unapproval',
  'Chores',
  'Issue Approval',
  'Demo_c',
  'Rimpa',
  '2025-12-16 09:30:00+00'::TIMESTAMPTZ,
  '2025-12-16 09:30:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1030',
  'Physical stock taking-->Filter item name not working. On the Physical Stock Taking page, when I filter items and update the stock for a particular item, the page refreshes and redirects to the first page. As a result, the applied filter is lost and I have to apply the filter again each time. Original Ref: CH-1030',
  'Pending',
  'Pending',
  '2025-12-16 10:01:54+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Physical stock taking-->Filter item name not working',
  'Chores',
  'Physical Stock Taking',
  'Demo_c',
  'Rimpa',
  '2025-12-16 09:30:00+00'::TIMESTAMPTZ,
  '2025-12-16 09:30:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1046',
  'User want to see item stocks (Same concepts of stk & all stk) before create production. Original Ref: CH-1046',
  'Pending',
  'Pending',
  '2025-12-18 17:06:11+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'User want to see item stocks (Same concepts of stk & all stk) before create production',
  'Chores',
  'EMS Dashboard',
  'Dynamic Engineers Pvt Ltd',
  'Rimpa',
  '2025-12-18 17:00:00+00'::TIMESTAMPTZ,
  '2025-12-18 17:00:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1067',
  'Change format add Division details in PO page header. Add Division details in PO page header in line no.4 above Department  , change format. Original Ref: CH-1067',
  'Pending',
  'Pending',
  '2025-12-23 17:58:41+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Change format add Division details in PO page header',
  'Chores',
  'PO Register',
  'BIHAR FOUNDRY',
  'Subhomoy',
  '2025-12-23 14:16:00+00'::TIMESTAMPTZ,
  '2025-12-23 15:05:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1069',
  'Notification change. In notification a Approver user should get indent related notification only Original Ref: CH-1069',
  'Pending',
  'Pending',
  '2025-12-24 10:09:50+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Notification change',
  'Chores',
  'Notifications',
  'BIHAR FOUNDRY',
  'Akash',
  '2025-12-23 21:39:00+00'::TIMESTAMPTZ,
  '2025-12-24 10:10:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1085',
  'Reorder level -->Filter item name not working. On the Reorder Level page, when I filter items and edit the reorder level for a particular item, the page refreshes and redirects to the first page. As a result, the applied filter is lost and I have to apply the filter again each time. Original Ref: CH-1085',
  'Pending',
  'Pending',
  '2025-12-29 09:22:43+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Reorder level -->Filter item name not working',
  'Chores',
  'Reorder Level',
  'Demo_c',
  'Rimpa',
  '2025-12-29 09:15:00+00'::TIMESTAMPTZ,
  '2025-12-29 09:15:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1092',
  'Add level wise filter & Log trail. Add level wise filter & log trail Original Ref: CH-1092',
  'Pending',
  'Pending',
  '2025-12-30 18:00:56+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add level wise filter & Log trail',
  'Chores',
  'Indents to Approve',
  'Demo_c',
  'Subhomoy',
  '2025-12-30 17:57:00+00'::TIMESTAMPTZ,
  '2025-12-30 17:57:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1093',
  'Add level wise filter & log trail. Add level wise filter & log trail Original Ref: CH-1093',
  'Pending',
  'Pending',
  '2025-12-30 18:02:28+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add level wise filter & log trail',
  'Chores',
  'Work Order Indents to Approve',
  'Demo_c',
  'Subhomoy',
  '2025-12-30 18:01:00+00'::TIMESTAMPTZ,
  '2025-12-30 18:02:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1094',
  'Add log trail in status. Add log trail in status Original Ref: CH-1094',
  'Pending',
  'Pending',
  '2025-12-30 18:03:45+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add log trail in status',
  'Chores',
  'GRN Approval',
  'Demo_c',
  'Subhomoy',
  '2025-12-30 18:03:00+00'::TIMESTAMPTZ,
  '2025-12-30 18:03:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1095',
  'Add log trail. Notifications --> GRN''s to approve , add log trail Original Ref: CH-1095',
  'Pending',
  'Pending',
  '2025-12-30 18:09:00+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add log trail',
  'Chores',
  'GRN Approval',
  'Demo_c',
  'Subhomoy',
  '2025-12-30 18:08:00+00'::TIMESTAMPTZ,
  '2025-12-30 18:08:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1096',
  'Add log trail. Add log trail in status Original Ref: CH-1096',
  'Pending',
  'Pending',
  '2025-12-30 18:10:23+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add log trail',
  'Chores',
  'POs To Approve',
  'Demo_c',
  'Subhomoy',
  '2025-12-30 18:09:00+00'::TIMESTAMPTZ,
  '2025-12-30 18:10:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1097',
  'Add level wise filter & log trail. Notifications --> Work orders to approve, Add level wise filter & log trail in status Original Ref: CH-1097',
  'Pending',
  'Pending',
  '2025-12-30 18:13:21+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add level wise filter & log trail',
  'Chores',
  'Notifications',
  'Demo_c',
  'Subhomoy',
  '2025-12-30 18:12:00+00'::TIMESTAMPTZ,
  '2025-12-30 18:12:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1098',
  'Add level wise filter & log trail. Add level wise filter & log trail in status Original Ref: CH-1098',
  'Pending',
  'Pending',
  '2025-12-30 18:14:54+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add level wise filter & log trail',
  'Chores',
  'Vendors to Approve',
  'Demo_c',
  'Subhomoy',
  '2025-12-30 18:14:00+00'::TIMESTAMPTZ,
  '2025-12-30 18:14:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1099',
  'Add level wise filter & log trail. Notifications --> WRN''s to approve Original Ref: CH-1099',
  'Pending',
  'Pending',
  '2025-12-30 18:17:28+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add level wise filter & log trail',
  'Chores',
  'Notifications',
  'Demo_c',
  'Subhomoy',
  '2025-12-30 18:17:00+00'::TIMESTAMPTZ,
  '2025-12-30 18:17:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1100',
  'Add level wise filter & log trail. Add level wise filter & log trail Original Ref: CH-1100',
  'Pending',
  'Pending',
  '2025-12-30 18:18:49+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add level wise filter & log trail',
  'Chores',
  'Issue Approval',
  'Demo_c',
  'Subhomoy',
  '2025-12-30 18:18:00+00'::TIMESTAMPTZ,
  '2025-12-30 18:18:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1101',
  'Add level wise filter & log trails. Add level wise filter & log trails Original Ref: CH-1101',
  'Pending',
  'Pending',
  '2025-12-30 18:19:57+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add level wise filter & log trails',
  'Chores',
  'Physical stocks to approve',
  'Demo_c',
  'Subhomoy',
  '2025-12-30 18:19:00+00'::TIMESTAMPTZ,
  '2025-12-30 18:19:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1102',
  'Add level wise filter & log trails. Add level wise filter & log trails Original Ref: CH-1102',
  'Pending',
  'Pending',
  '2025-12-30 18:20:57+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add level wise filter & log trails',
  'Chores',
  'Stock Adjustment Approvals',
  'Demo_c',
  'Subhomoy',
  '2025-12-30 18:20:00+00'::TIMESTAMPTZ,
  '2025-12-30 18:20:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1103',
  'Add level wise filter & log trails. Add level wise filter & log trails Original Ref: CH-1103',
  'Pending',
  'Pending',
  '2025-12-30 18:21:49+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add level wise filter & log trails',
  'Chores',
  'Pending Bills to Approve',
  'Demo_c',
  'Subhomoy',
  '2025-12-30 18:21:00+00'::TIMESTAMPTZ,
  '2025-12-30 18:21:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'BU-0131',
  'Enables buttons for Approve/Unapprove/Delete for POs. Enables buttons for Approve/Unapprove/Delete for POs which created previously before assigning the approval levels. Original Ref: BU-0131',
  'Pending',
  'Pending',
  '2026-01-07 12:42:24+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Enables buttons for Approve/Unapprove/Delete for POs',
  'Bugs',
  'POs To Approve',
  'BIHAR FOUNDRY',
  'Shreyasi',
  '2026-01-07 11:49:00+00'::TIMESTAMPTZ,
  '2026-01-07 12:21:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1147',
  'Add preview in Indent creation. System will show the preview after putting all details and clicking on ''CREATE INDENT'' Original Ref: CH-1147',
  'Pending',
  'Pending',
  '2026-01-15 13:53:17+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add preview in Indent creation',
  'Chores',
  'Create Indent',
  'BIHAR FOUNDRY',
  'Shreyasi',
  '2026-01-15 10:00:00+00'::TIMESTAMPTZ,
  '2026-01-15 10:00:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1148',
  'Add preview in WO Indent creation. System will show the preview after putting all details and clicking on ''CREATE'' Original Ref: CH-1148',
  'Pending',
  'Pending',
  '2026-01-15 13:56:59+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Add preview in WO Indent creation',
  'Chores',
  'Create Wo Indent',
  'BIHAR FOUNDRY',
  'Shreyasi',
  '2026-01-15 10:00:00+00'::TIMESTAMPTZ,
  '2026-01-15 10:00:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1177',
  'Here is the list of item names along with their item groups that do not have item codes.. https://docs.google.com/spreadsheets/d/1HT7nLzplmdbLPTKn4rnuKmQfrgzmuWm4/edit?usp=sharing&ouid=101600060197177007306&rtpof=true&sd=true Original Ref: CH-1177',
  'Pending',
  'Pending',
  '2026-01-27 14:34:56+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Here is the list of item names along with their item groups that do not have item codes.',
  'Chores',
  'ITEM',
  'BIHAR FOUNDRY',
  'Akash',
  '2026-01-27 13:20:00+00'::TIMESTAMPTZ,
  '2026-01-27 13:25:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1181',
  'PO Register Total not match with Export File.. "Division All, Date - 1/10/25 to 1/1/26, Status - Approved Or (Approved + Created), Total in Excel - 524531 but in system - 85099. Not match " Original Ref: CH-1181',
  'Pending',
  'Pending',
  '2026-01-28 16:29:08+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'PO Register Total not match with Export File.',
  'Chores',
  'PO Register',
  'Demo_c',
  'Akash',
  '2026-01-28 16:28:00+00'::TIMESTAMPTZ,
  '2026-01-28 16:28:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1218',
  'Updated GRN according the remarks column. Original Ref: CH-1218',
  'Pending',
  'Pending',
  '2026-02-06 17:30:57+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Updated GRN according the remarks column',
  'Chores',
  'GRN Register',
  'BIHAR FOUNDRY',
  'Rimpa',
  '2026-02-06 11:50:00+00'::TIMESTAMPTZ,
  '2026-02-06 00:19:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1230',
  'When adding a new Indenter, user want all divisions be selectable with a single click (Select All). Original Ref: CH-1230',
  'Pending',
  'Pending',
  '2026-02-12 17:32:38+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'When adding a new Indenter, user want all divisions be selectable with a single click (Select All)',
  'Chores',
  'Set Up',
  'Bhagwati Power Pvt. Ltd.',
  'Rimpa',
  '2026-02-11 16:00:00+00'::TIMESTAMPTZ,
  '2026-02-11 16:00:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1231',
  'User want all division select option in Pending Indent RFQ page. Original Ref: CH-1231',
  'Pending',
  'Pending',
  '2026-02-12 17:34:45+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'User want all division select option in Pending Indent RFQ page',
  'Chores',
  'Pending Indent RFQ',
  'Bhagwati Power Pvt. Ltd.',
  'Rimpa',
  '2026-02-11 16:00:00+00'::TIMESTAMPTZ,
  '2026-02-11 16:00:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1232',
  'User want manual date option in Manual quote QC page. Original Ref: CH-1232',
  'Pending',
  'Pending',
  '2026-02-12 17:39:22+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'User want manual date option in Manual quote QC page',
  'Chores',
  'Quotation Comparison',
  'Bhagwati Power Pvt. Ltd.',
  'Rimpa',
  '2026-02-11 16:00:00+00'::TIMESTAMPTZ,
  '2026-02-11 16:00:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1233',
  'GRN Entry-->Freight. "1.User want If Freight inclusive in PO then not showing Freight entry option in GRN. 2.User want If Freight exclusive or other in PO then showing Freight entry option in GRN. " Original Ref: CH-1233',
  'Pending',
  'Pending',
  '2026-02-12 17:57:53+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'GRN Entry-->Freight',
  'Chores',
  'GRN Entry',
  'Bhagwati Power Pvt. Ltd.',
  'Rimpa',
  '2026-02-12 15:00:00+00'::TIMESTAMPTZ,
  '2026-02-12 15:00:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1234',
  'Enable Vendor code in vendor list.. Original Ref: CH-1234',
  'Pending',
  'Pending',
  '2026-02-13 15:52:20+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Enable Vendor code in vendor list.',
  'Chores',
  'Vendors',
  'Bhagwati Power Pvt. Ltd.',
  'Rimpa',
  '2026-02-13 15:00:00+00'::TIMESTAMPTZ,
  '2026-02-13 15:00:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'BU-0138',
  'Same problem in FMS-1195. Original Ref: BU-0138',
  'Pending',
  'Pending',
  '2026-02-14 15:08:51+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'Same problem in FMS-1195',
  'Bugs',
  'Issue Register',
  'Karnikripa Power Pvt Ltd',
  'Rimpa',
  '2026-02-14 14:50:00+00'::TIMESTAMPTZ,
  '2026-02-14 14:53:00+00'::TIMESTAMPTZ
);
INSERT INTO public.support_tickets (
  old_reference_no, description, stage, status, created_at, planned_resolution_date, actual_resolution_date, response_source,
  title, type_of_request, page, company_name, submitted_by, query_arrival_at, query_response_at
) VALUES (
  'CH-1239',
  'In Stock Adjustment, the "Rate" field should be mandatory only for Bhagwati. Original Ref: CH-1239',
  'Pending',
  'Pending',
  '2026-02-16 16:33:50+00'::TIMESTAMPTZ,
  NULL,
  NULL,
  'upload',
  'In Stock Adjustment, the "Rate" field should be mandatory only for Bhagwati',
  'Chores',
  'Stock Adjustment',
  'Bhagwati Power Pvt. Ltd.',
  'Rimpa',
  '2026-02-16 16:30:00+00'::TIMESTAMPTZ,
  '2026-02-16 16:30:00+00'::TIMESTAMPTZ
);

-- After running all INSERTs above, run this once so new tickets get the next reference number (e.g. CH-079):
SELECT setval(
  'public.support_tickets_ref_seq',
  COALESCE((
    SELECT MAX(SUBSTRING(reference_no FROM '[0-9]+')::INTEGER)
    FROM public.support_tickets
    WHERE reference_no ~ '^CH-[0-9]+$'
  ), 0) + 1
);
COMMIT;
