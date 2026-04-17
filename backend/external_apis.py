"""
External Medical API Services — Healthcare AI System
Integrates: OpenFDA, ICD-10 (NLM), MedlinePlus, WHO GHO
"""

import httpx
import json
import xml.etree.ElementTree as ET
from typing import List, Dict, Optional
import asyncio

# ── OpenFDA Drug Interaction Checker ─────────────────────────────────────────

OPENFDA_BASE = "https://api.fda.gov"

async def check_drug_interactions(drugs: List[str], api_key: str = "") -> Dict:
    """
    Check drug adverse events using OpenFDA API.
    Returns: list of significant adverse events, severity, and counts.
    """
    if not drugs:
        return {"success": False, "error": "No drugs provided"}

    results = []
    async with httpx.AsyncClient(timeout=15) as client:
        for drug in drugs[:5]:  # limit to 5 drugs per call
            try:
                # Use broader search: brand name OR generic name to get real data
                search_query = (
                    f'patient.drug.openfda.brand_name:"{drug}" '
                    f'OR patient.drug.openfda.generic_name:"{drug}" '
                    f'OR patient.drug.medicinalproduct:"{drug}"'
                )
                params = {
                    "search": search_query,
                    "count": "patient.reaction.reactionmeddrapt.exact",
                    "limit": "10",
                }
                if api_key:
                    params["api_key"] = api_key

                resp = await client.get(f"{OPENFDA_BASE}/drug/event.json", params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    events = data.get("results", [])
                    # Each event in a count query has 'term' and 'count' keys
                    formatted_events = [
                        {"term": e.get("term", ""), "count": e.get("count", 0)}
                        for e in events[:10]
                    ]
                    total = data.get("meta", {}).get("results", {}).get("total", 0)
                    results.append({
                        "drug": drug,
                        "top_adverse_events": formatted_events,
                        "total_reports": total
                    })
                elif resp.status_code == 404:
                    results.append({"drug": drug, "top_adverse_events": [], "total_reports": 0})
                else:
                    results.append({"drug": drug, "error": f"HTTP {resp.status_code}", "total_reports": 0, "top_adverse_events": []})
            except Exception as e:
                results.append({"drug": drug, "error": str(e), "total_reports": 0, "top_adverse_events": []})

    # Determine severity
    severity = "LOW"
    total_reports = sum(r.get("total_reports", 0) for r in results)
    if total_reports > 50000:
        severity = "HIGH"
    elif total_reports > 10000:
        severity = "MODERATE"

    return {
        "success": True,
        "drugs_checked": len(drugs),
        "severity": severity,
        "total_adverse_reports": total_reports,
        "drug_results": results,
        "disclaimer": "This data is from FDA adverse event reports. Always consult a licensed physician.",
        "source": "OpenFDA API (api.fda.gov)"
    }


async def get_drug_info(drug_name: str, api_key: str = "") -> Dict:
    """Get drug label information from OpenFDA"""
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            params = {
                "search": f"openfda.brand_name:\"{drug_name}\"",
                "limit": "1"
            }
            if api_key:
                params["api_key"] = api_key

            resp = await client.get(f"{OPENFDA_BASE}/drug/label.json", params=params)
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results", [])
                if results:
                    r = results[0]
                    return {
                        "success": True,
                        "drug": drug_name,
                        "brand_name": r.get("openfda", {}).get("brand_name", ["Unknown"])[0],
                        "generic_name": r.get("openfda", {}).get("generic_name", ["Unknown"])[0],
                        "manufacturer": r.get("openfda", {}).get("manufacturer_name", ["Unknown"])[0],
                        "indications": (r.get("indications_and_usage", [""])[0])[:500],
                        "warnings": (r.get("warnings", [""])[0])[:500] if r.get("warnings") else "See label",
                        "dosage": (r.get("dosage_and_administration", [""])[0])[:400] if r.get("dosage_and_administration") else "Consult physician",
                    }
            return {"success": False, "drug": drug_name, "error": "Drug not found in FDA database"}
        except Exception as e:
            return {"success": False, "error": str(e)}


# ── ICD-10 Code Lookup (NLM ClinicalTables) ───────────────────────────────────

ICD10_BASE = "https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search"

async def search_icd10(term: str, max_results: int = 10) -> Dict:
    """
    Search ICD-10 codes by term using NLM ClinicalTables API.
    No API key required.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            params = {
                "sf": "code,name",
                "terms": term,
                "maxList": max_results,
            }
            resp = await client.get(ICD10_BASE, params=params)
            if resp.status_code == 200:
                data = resp.json()
                # Response: [total, codes_list, extra, names_list]
                total = data[0] if data else 0
                code_list = data[3] if len(data) > 3 else []

                results = [
                    {"code": item[0], "description": item[1]}
                    for item in code_list
                ] if code_list else []

                return {
                    "success": True,
                    "search_term": term,
                    "total_found": total,
                    "results": results,
                    "source": "NLM ClinicalTables ICD-10 CM"
                }
            return {"success": False, "error": f"ICD-10 API returned {resp.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}


# ── MedlinePlus Patient Info ──────────────────────────────────────────────────

MEDLINEPLUS_BASE = "https://wsearch.nlm.nih.gov/ws/query"

async def get_medlineplus_info(disease: str, language: str = "english") -> Dict:
    """
    Get patient-friendly disease information from MedlinePlus.
    No API key required. Returns XML → parsed into clean dict.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            params = {
                "db": "healthTopics",
                "term": disease,
                "retmax": "3",
            }
            resp = await client.get(MEDLINEPLUS_BASE, params=params)
            if resp.status_code != 200:
                return {"success": False, "error": "MedlinePlus unavailable"}

            # Parse XML response
            root = ET.fromstring(resp.text)
            articles = []
            for doc in root.findall(".//document"):
                title_el = doc.find("content[@name='title']")
                summary_el = doc.find("content[@name='FullSummary']")
                url_el = doc.find("content[@name='url']")
                also_called_el = doc.find("content[@name='altTitle']")

                title = title_el.text if title_el is not None else "Unknown"
                raw_summary = summary_el.text if summary_el is not None else ""

                # strip HTML tags from summary
                import re
                clean_summary = re.sub(r'<[^>]+>', '', raw_summary)[:600]

                articles.append({
                    "title": title,
                    "summary": clean_summary,
                    "url": url_el.text if url_el is not None else "",
                    "also_called": also_called_el.text if also_called_el is not None else "",
                })

            return {
                "success": True,
                "disease": disease,
                "articles": articles,
                "source": "NLM MedlinePlus"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


# ── WHO Global Health Observatory ─────────────────────────────────────────────

WHO_GHO_BASE = "https://ghoapi.azureedge.net/api"

# Useful indicator codes
WHO_INDICATORS = {
    "life_expectancy": "WHOSIS_000001",
    "diabetes_prevalence": "NCD_GLUC_04",
    "hypertension": "NCD_HYP_PREVALENCE_A",
    "obesity": "NCD_BMI_30A",
    "cardiovascular_mortality": "CARDIOVASCULAR_DEATHS",
    "kidney_disease": "NCD_MORT_KIDNEY",
}

async def get_who_stats(indicator: str = "life_expectancy", country: str = "IND") -> Dict:
    """
    Fetch WHO global health statistics for a given indicator.
    No API key required.
    """
    # Resolve friendly name to code
    code = WHO_INDICATORS.get(indicator, indicator)

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            # Get data filtered by country
            url = f"{WHO_GHO_BASE}/IndicatorData"
            params = {
                "$filter": f"Indicator eq '{code}' and SpatialDim eq '{country}'",
                "$orderby": "TimeDim desc",
                "$top": "5",
                "$format": "json"
            }
            resp = await client.get(url, params=params)

            if resp.status_code == 200:
                data = resp.json()
                values = data.get("value", [])

                formatted = [
                    {
                        "year": v.get("TimeDim"),
                        "country": v.get("SpatialDim"),
                        "value": v.get("NumericValue"),
                        "unit": v.get("Comments", ""),
                    }
                    for v in values[:5]
                ]

                return {
                    "success": True,
                    "indicator": indicator,
                    "indicator_code": code,
                    "country": country,
                    "data_points": formatted,
                    "source": "WHO Global Health Observatory"
                }
            return {"success": False, "error": f"WHO API returned {resp.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}


async def get_who_indicators_list() -> Dict:
    """Get list of all available WHO health indicators"""
    async with httpx.AsyncClient(timeout=20) as client:
        try:
            resp = await client.get(f"{WHO_GHO_BASE}/Indicator", params={"$top": "20"})
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "success": True,
                    "available_indicators": WHO_INDICATORS,
                    "source": "WHO GHO"
                }
            return {"success": False}
        except Exception as e:
            return {"success": False, "error": str(e)}
