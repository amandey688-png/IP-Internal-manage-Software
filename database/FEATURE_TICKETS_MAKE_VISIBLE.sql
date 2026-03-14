-- ============================================================================
-- Make existing Feature tickets visible in "Approval Status"
-- ============================================================================
-- If you already ran the INSERT and feature tickets still don't show:
-- The app shows feature tickets in Support → "Approval Status" only when
-- approval_status IS NULL or 'unapproved'. Run this to fix existing rows.
-- ============================================================================

UPDATE public.tickets
SET approval_status = NULL
WHERE type = 'feature'
  AND reference_no IN (
    'FE-0129', 'FE-0130', 'FE-0131', 'FE-0132', 'FE-0133', 'FE-0134', 'FE-0135',
    'FE-0136', 'FE-0137', 'FE-0138', 'FE-0139', 'FE-0140', 'FE-0141', 'FE-0142',
    'FE-0143', 'FE-0144', 'FE-0145', 'FE-0146', 'FE-0147', 'FE-0148', 'FE-0149',
    'FE-0150', 'FE-0151', 'FE-0152', 'FE-0153', 'FE-0154', 'FE-0155', 'FE-0156',
    'FE-0157', 'FE-0158', 'FE-0159', 'FE-0160', 'FE-0161', 'FE-0162', 'FE-0163',
    'FE-0164', 'FE-0165', 'FE-0166', 'FE-0167', 'FE-0168', 'FE-0169', 'FE-0170',
    'FE-0171', 'FE-0172', 'FE-0173', 'FE-0174', 'FE-0175', 'FE-0176', 'FE-0177',
    'FE-0178', 'FE-0179', 'FE-0180', 'FE-0181', 'FE-0182', 'FE-0183', 'FE-0184',
    'FE-0185', 'FE-0186', 'FE-0187', 'FE-0188', 'FE-0189', 'FE-0190', 'FE-0191',
    'FE-0192', 'FE-0193', 'FE-0194', 'FE-0195', 'FE-0196', 'FE-0197', 'FE-0198',
    'FE-0199', 'FE-0200', 'FE-0201', 'FE-0202', 'FE-0203', 'FE-0204', 'FE-0205',
    'FE-0206', 'FE-0207', 'FE-0208', 'FE-0209', 'FE-0210', 'FE-0211', 'FE-0212',
    'FE-0213', 'FE-0214', 'FE-0215', 'FE-0216', 'FE-0217', 'FE-0218'
  );
