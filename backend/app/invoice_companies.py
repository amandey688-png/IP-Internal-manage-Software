"""
Canonical company names for Add / Edit Invoice (Payment Management).
Seeded via database/INVOICE_COMPANY_MASTER.sql into public.companies.
"""
from __future__ import annotations

from app.payment_ageing import fuzzy_ageing_assignments, normalize_company_name

# Authoritative list — Add Invoice "Company Name" dropdown (order preserved in UI).
INVOICE_COMPANY_NAMES: tuple[str, ...] = (
    "Agroha Steel and Power Pvt. Ltd.",
    "Amiya Steel Pvt. Ltd.",
    "Anjanisuta Steels Private Limited",
    "B R Refinery LLP",
    "B. R Sponge & Power Ltd.",
    "Balajee Mini Steels & Re Rolling Pvt. Ltd.",
    "Balmukund Cement & Roofing (P) Ltd.",
    "Balmukund Sponge Iron Pvt. Ltd.",
    "Bharat Hitech (Cements) Pvt Ltd",
    "Bihar Foundry & Casting Limited",
    "Black Rock Steel & Power Pvt Ltd",
    "Brahmaputra Metallics Ltd.",
    "Coffers Metallics Pvt. Ltd.",
    "Crescent Foundry Co Pvt.Ltd.",
    "Dadiji Steel Manufacture & Trading Pvt Ltd",
    "Dhanbad Fuels Ltd.",
    "Dinesh Brothers Pvt. Ltd.",
    "Ferro Metals",
    "Flexicom Industries Pvt. Ltd.",
    "GM Iron & Steel Pvt. Ltd.",
    "GM Iron & Steels Ltd. Badampahar",
    "Gopal Sponge & Power Pvt. Ltd.",
    "Govind Steel Co. Ltd.",
    "Govinda Polytex India Pvt. Ltd.",
    "Hariom Ingots & Power Pvt. Ltd.",
    "Hi-Tech Power & Steel Ltd.",
    "Hitech Plastochem Udyog Pvt. Ltd.",
    "Indo East Corporation Pvt. Ltd.",
    "Jay Iron & Steels Ltd.",
    "Karni Kripa Power Pvt Ltd",
    "Kedia Carbon Pvt. Ltd.",
    "Kodarma Chemical Pvt. Ltd.",
    "Kodarma Petrochemicals Pvt. Ltd.",
    "Maa Mangla Ispat Pvt. Ltd 2",
    "Maa Mangla Ispat Pvt. Ltd.",
    "Maa Shakambari Steel Ltd.",
    "Maan Concast Pvt. Ltd.",
    "Maan Steel & Power Ltd.",
    "Mangal Sponge & Steel Pvt. Ltd.",
    "Mark Steels P Ltd.",
    "Maruti Ferrous Private Limited",
    "MVK Industries Pvt. Ltd.",
    "Niranjan Metalliks Ltd.",
    "Nutan Ispat & Power Ltd",
    "Odissa Concrete & Allied Industries Limited",
    "Orissa Concrete & Allied Industries Ltd. (Raipur)",
    "Plascom Industries LLP",
    "Pratishtha Polypack Pvt. Ltd.",
    "Rashmi Sponge Iron & Power Industries Pvt. Ltd.",
    "Rausheena Udyog Ltd.",
    "Roopgarh Power & Alloys Pvt. Ltd.",
    "Salagram Power & Steels Ltd.",
    "Shakambari Overseas Trade Pvt. Ltd.",
    "Shikhara Steels Pvt. Ltd.",
    "Shilphy Steels Pvt. Ltd.",
    "Shree Parashnath Re-Roolling Mills Ltd.",
    "Shri Varu Polytex Pvt. Ltd.",
    "Singhal Enterprises(Jharsuguda)Pvt Ltd",
    "Sky Alloys and Power Pvt Ltd",
    "Sky Steel & Power Pvt. Ltd",
    "Spintech Tubes Pvt. Ltd.",
    "Sri Venkatesh Iron & Alloys (India) Ltd.",
    "Super Iron Foundry",
    "Suprime Cement Pvt. Ltd.",
    "Surendra Mining Industries Pvt. Ltd.",
    "Ugen Ferro Alloys Pvt. Ltd.",
    "Utkal Hydrocarbon Pvt. Ltd.",
    "Vaswani Industries Limited",
    "Vighneshwar Ispat Pvt. Ltd.",
    "Vraj Iron & Steels Ltd. (Siltara Div)",
    "Vraj Iron & Steels Ltd. Bilaspur",
    "Vraj Metaliks Pvt. Ltd.",
)

INVOICE_COMPANY_KEYS: frozenset[str] = frozenset(
    normalize_company_name(x) for x in INVOICE_COMPANY_NAMES if x.strip()
)


def _index_companies_by_norm(companies_rows: list[dict]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for row in companies_rows:
        name = (row.get("name") or "").strip()
        cid = row.get("id")
        if not name or not cid:
            continue
        nk = normalize_company_name(name)
        if nk and nk not in out:
            out[nk] = {"id": str(cid), "name": name}
    return out


def build_invoice_company_options(companies_rows: list[dict]) -> list[dict]:
    """Ordered {id, name} for invoice UI; matches master list to public.companies."""
    by_norm = _index_companies_by_norm(companies_rows)
    db_norm_keys = list(by_norm.keys())
    fuzzy: dict[str, str] = {}
    missing_keys = [
        normalize_company_name(n)
        for n in INVOICE_COMPANY_NAMES
        if normalize_company_name(n) and normalize_company_name(n) not in by_norm
    ]
    if missing_keys and db_norm_keys:
        fuzzy = fuzzy_ageing_assignments(missing_keys, {k: {} for k in db_norm_keys}, min_score=0.68)

    options: list[dict] = []
    for canonical in INVOICE_COMPANY_NAMES:
        nk = normalize_company_name(canonical)
        if not nk:
            continue
        hit = by_norm.get(nk)
        if not hit and nk in fuzzy:
            hit = by_norm.get(fuzzy[nk])
        if hit:
            options.append({"id": hit["id"], "name": hit["name"]})
        else:
            options.append({"id": nk, "name": canonical})
    return options


def resolve_invoice_company_name(
    company_name: str,
    companies_rows: list[dict] | None = None,
) -> str | None:
    """Map submitted name to canonical companies.name when in the invoice allowlist."""
    raw = (company_name or "").strip()
    if not raw:
        return None
    nk = normalize_company_name(raw)
    if nk not in INVOICE_COMPANY_KEYS:
        return None
    if companies_rows is None:
        return raw
    for opt in build_invoice_company_options(companies_rows):
        if normalize_company_name(opt["name"]) == nk or normalize_company_name(raw) == normalize_company_name(opt["name"]):
            return opt["name"]
    if nk in INVOICE_COMPANY_KEYS:
        for canonical in INVOICE_COMPANY_NAMES:
            if normalize_company_name(canonical) == nk:
                return canonical
    return None
