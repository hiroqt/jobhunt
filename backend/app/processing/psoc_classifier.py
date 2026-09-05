import re
from typing import Dict, Any, Optional, List, Tuple

# PSA PSOC 2012 (Philippine Standard Occupational Classification) 10 Major Groups
PSOC_MAJOR_GROUPS: Dict[int, Dict[str, str]] = {
    1: {
        "code": "1",
        "name": "Managers",
        "description": "Corporate managers, general managers, executives, team leads, project managers, and supervisors.",
    },
    2: {
        "code": "2",
        "name": "Professionals",
        "description": "Software engineers, developers, data scientists, architects, IT analysts, accountants, HR professionals.",
    },
    3: {
        "code": "3",
        "name": "Technicians and Associate Professionals",
        "description": "QA testers, technical support tier 2/3, system administrators, graphic designers, digital marketers.",
    },
    4: {
        "code": "4",
        "name": "Clerical Support Workers",
        "description": "Customer service representatives (CSR), technical support representatives (TSR), virtual assistants, data encoders.",
    },
    5: {
        "code": "5",
        "name": "Service and Sales Workers",
        "description": "Sales executives, account executives, sales development reps (SDR), retail and customer care specialists.",
    },
    6: {
        "code": "6",
        "name": "Skilled Agricultural, Forestry and Fishery Workers",
        "description": "Agricultural specialists, farm operations, forestry and fishery managers.",
    },
    7: {
        "code": "7",
        "name": "Craft and Related Trades Workers",
        "description": "Hardware technicians, network cabling technicians, electricians, maintenance and repair mechanics.",
    },
    8: {
        "code": "8",
        "name": "Plant and Machine Operators and Assemblers",
        "description": "Electronics assemblers, manufacturing equipment operators, logistics and delivery drivers.",
    },
    9: {
        "code": "9",
        "name": "Elementary Occupations",
        "description": "Facilities staff, general office assistants, cleaners, material handlers.",
    },
    0: {
        "code": "0",
        "name": "Armed Forces Occupations",
        "description": "Corporate safety officers, security directors, defense specialists.",
    },
}

# Heuristic patterns for PSOC Major Groups
PSOC_PATTERNS: List[Tuple[int, List[str]]] = [
    (
        4,  # Clerical Support Workers (CSR, TSR, VA, BPO Agents, Assistants)
        [
            r"\bvirtual assistant\b", r"\bva\b", r"\bexecutive assistant\b", r"\badmin assistant\b",
            r"\bexecutive support\b", r"\bassistant\b", r"\bcsr\b", r"\btsr\b",
            r"\bcustomer service\b", r"\bcustomer support\b", r"\bdata entry\b", r"\bencoder\b",
            r"\bcall center\b", r"\bbpo\b", r"\bvoice agent\b", r"\bnon voice\b",
            r"\bchat support\b", r"\bclerk\b"
        ],
    ),
    (
        1,  # Managers
        [
            r"\bmanager\b", r"\bdirector\b", r"\bhead of\b", r"\bvp\b", r"\bvice president\b",
            r"\bchief\b", r"\bchief executive\b", r"\bofficer\b", r"\blead\b", r"\btech lead\b",
            r"\bengineering manager\b", r"\bproduct manager\b", r"\bproject manager\b",
            r"\bscrum master\b", r"\bsupervisor\b", r"\bteam lead\b", r"\bprincipal\b"
        ],
    ),
    (
        2,  # Professionals (Software Engineers, Architects, Analysts, Designers)
        [
            r"\bengineer\b", r"\bdeveloper\b", r"\bprogrammer\b", r"\barchitect\b",
            r"\bscientist\b", r"\banalyst\b", r"\bdesigner\b", r"\bconsultant\b",
            r"\bfrontend\b", r"\bbackend\b", r"\bfullstack\b", r"\bfull stack\b",
            r"\bdevops\b", r"\bsre\b", r"\bsoftware\b", r"\bweb developer\b",
            r"\bmobile developer\b", r"\bios\b", r"\bandroid\b", r"\bflutter\b",
            r"\bdata engineer\b", r"\bcloud\b", r"\bsecurity engineer\b",
            r"\baccountant\b", r"\bhr specialist\b", r"\brecruiter\b"
        ],
    ),
    (
        3,  # Technicians & Associate Professionals
        [
            r"\bqa\b", r"\btester\b", r"\bquality assurance\b", r"\btest engineer\b",
            r"\bsystem administrator\b", r"\bsysadmin\b", r"\bnetwork admin\b",
            r"\btechnician\b", r"\bsupport tier\b", r"\bit support\b", r"\bhelpdesk\b",
            r"\bgraphic designer\b", r"\bcontent creator\b", r"\bdigital marketer\b",
            r"\bseo specialist\b", r"\bsocial media specialist\b"
        ],
    ),
    (
        5,  # Service and Sales Workers
        [
            r"\bsales\b", r"\baccount executive\b", r"\bsdr\b", r"\bbdr\b",
            r"\bbusiness development\b", r"\btelemarketing\b", r"\btelemarketer\b",
            r"\binside sales\b", r"\boutside sales\b", r"\bretail\b", r"\bstore associate\b"
        ],
    ),
    (
        7,  # Craft and Related Trades
        [
            r"\bcabling\b", r"\belectrician\b", r"\bmechanic\b", r"\bhardware technician\b",
            r"\bmaintenance technician\b", r"\binstaller\b"
        ],
    ),
    (
        8,  # Machine Operators & Assemblers
        [
            r"\bassembler\b", r"\bmachine operator\b", r"\bdriver\b", r"\brider\b",
            r"\bcourier\b", r"\bwarehouse operator\b"
        ],
    ),
]


def classify_psoc_major_group(title: str, description: str = "") -> Dict[str, Any]:
    """
    Classifies a job title and description into the PSA PSOC 10 Major Groups.
    Returns:
      {
         "group_code": 2,
         "group_name": "Professionals",
         "confidence": 0.85
      }
    """
    if not title:
        return {
            "group_code": 2,
            "group_name": PSOC_MAJOR_GROUPS[2]["name"],
            "confidence": 0.5,
        }

    combined_text = f"{title.lower()} {description[:300].lower() if description else ''}"

    # Check managers first to avoid classifying 'Engineering Manager' as purely 'Engineer' (Group 2)
    for group_code, patterns in PSOC_PATTERNS:
        for p in patterns:
            if re.search(p, title.lower()):
                return {
                    "group_code": group_code,
                    "group_name": PSOC_MAJOR_GROUPS[group_code]["name"],
                    "confidence": 0.9,
                }

    # Fallback search on combined text
    for group_code, patterns in PSOC_PATTERNS:
        for p in patterns:
            if re.search(p, combined_text):
                return {
                    "group_code": group_code,
                    "group_name": PSOC_MAJOR_GROUPS[group_code]["name"],
                    "confidence": 0.7,
                }

    # Default fallback to Professionals (Group 2)
    return {
        "group_code": 2,
        "group_name": PSOC_MAJOR_GROUPS[2]["name"],
        "confidence": 0.5,
    }


# Complete Philippine Regional and Urban Mapping (17 Regions + Major Business Hubs)
PH_REGIONS: Dict[str, Dict[str, Any]] = {
    "NCR": {
        "name": "National Capital Region (NCR / Metro Manila)",
        "cities_and_hubs": [
            "bgc", "bonifacio global city", "taguig", "makati", "ortigas", "pasig",
            "mandaluyong", "quezon city", "qc", "eastwood", "cyberpark", "cubao",
            "manila", "alabang", "muntinlupa", "pasay", "parañaque", "paranaque",
            "las piñas", "las pinas", "marikina", "san juan", "caloocan", "malabon",
            "navotas", "valenzuela", "pateros", "metro manila", "ncr"
        ],
    },
    "CAR": {
        "name": "Cordillera Administrative Region (CAR)",
        "cities_and_hubs": ["baguio", "benguet", "abra", "apayao", "ifugao", "kalinga", "mountain province"],
    },
    "Region I": {
        "name": "Region I (Ilocos Region)",
        "cities_and_hubs": ["san fernando la union", "la union", "laoag", "ilocos norte", "vigan", "ilocos sur", "dagupan", "pangasinan"],
    },
    "Region II": {
        "name": "Region II (Cagayan Valley)",
        "cities_and_hubs": ["tuguegarao", "cagayan", "santiago", "isabela", "batanes", "nueva vizcaya", "quirino"],
    },
    "Region III": {
        "name": "Region III (Central Luzon)",
        "cities_and_hubs": ["clark", "angeles", "san fernando pampanga", "pampanga", "subic", "zambales", "bataan", "bulacan", "tarlac", "nueva ecija", "aurora"],
    },
    "Region IV-A": {
        "name": "Region IV-A (CALABARZON)",
        "cities_and_hubs": [
            "calabarzon", "laguna", "santa rosa", "sta rosa", "biñan", "binan", "calamba", "cabuyao",
            "cavite", "bacoor", "imus", "dasmarinas", "dasmariñas", "general trias", "tagaytay",
            "batangas", "lipa", "batangas city", "rizal", "antipolo", "cainta", "taytay", "quezon province", "lucena"
        ],
    },
    "Region IV-B": {
        "name": "Region IV-B (MIMAROPA)",
        "cities_and_hubs": ["puerto princesa", "palawan", "calapan", "oriental mindoro", "occidental mindoro", "marinduque", "romblon"],
    },
    "Region V": {
        "name": "Region V (Bicol Region)",
        "cities_and_hubs": ["legazpi", "albay", "naga", "camarines sur", "camarines norte", "sorsogon", "catanduanes", "masbate"],
    },
    "Region VI": {
        "name": "Region VI (Western Visayas)",
        "cities_and_hubs": ["iloilo", "iloilo city", "bacolod", "negros occidental", "aklan", "boracay", "antique", "capiz", "roxas", "guimaras"],
    },
    "Region VII": {
        "name": "Region VII (Central Visayas)",
        "cities_and_hubs": ["cebu", "cebu city", "cebu it park", "mandaue", "lapu-lapu", "lapu lapu", "talisay", "bohol", "tagbilaran", "siquijor", "negros oriental", "dumaguete"],
    },
    "Region VIII": {
        "name": "Region VIII (Eastern Visayas)",
        "cities_and_hubs": ["tacloban", "leyte", "ormoc", "samar", "calbayog", "eastern samar", "northern samar", "biliran", "southern leyte"],
    },
    "Region IX": {
        "name": "Region IX (Zamboanga Peninsula)",
        "cities_and_hubs": ["zamboanga", "zamboanga city", "pagadian", "dipolog", "zamboanga del norte", "zamboanga del sur", "zamboanga sibugay"],
    },
    "Region X": {
        "name": "Region X (Northern Mindanao)",
        "cities_and_hubs": ["cagayan de oro", "cdo", "misamis oriental", "iligan", "lanao del norte", "bukidnon", "malaybalay", "valencia", "camiguin", "misamis occidental", "ozamiz"],
    },
    "Region XI": {
        "name": "Region XI (Davao Region)",
        "cities_and_hubs": ["davao", "davao city", "tagum", "panabo", "mati", "davao del norte", "davao del sur", "davao oriental", "davao de oro", "davao occidental"],
    },
    "Region XII": {
        "name": "Region XII (SOCCSKSARGEN)",
        "cities_and_hubs": ["general santos", "gensan", "koronadal", "south cotabato", "cotabato", "tacurong", "sultan kudarat", "sarangani"],
    },
    "Region XIII": {
        "name": "Region XIII (Caraga)",
        "cities_and_hubs": ["butuan", "agusan del norte", "agusan del sur", "surigao", "surigao del norte", "surigao del sur", "bislig", "dinagat islands"],
    },
    "BARMM": {
        "name": "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",
        "cities_and_hubs": ["cotabato city", "marawi", "maguindanao", "lanao del sur", "basilan", "sulu", "tawi-tawi"],
    },
}


def normalize_philippine_location(raw_location: Optional[str]) -> Dict[str, Any]:
    """
    Normalizes a freeform location into Philippine region and country identifiers.
    Returns:
      {
         "raw_location": "BGC, Taguig",
         "is_philippines": True,
         "region_code": "NCR",
         "region_name": "National Capital Region (NCR / Metro Manila)",
         "normalized_location": "Taguig, Metro Manila, Philippines"
      }
    """
    if not raw_location:
        return {
            "raw_location": "Philippines",
            "is_philippines": True,
            "region_code": "NCR",
            "region_name": PH_REGIONS["NCR"]["name"],
            "normalized_location": "Philippines",
        }

    loc_lower = raw_location.lower().strip()
    is_ph = any(k in loc_lower for k in ["philippines", "ph", "pilipinas", "manila", "cebu", "davao", "pampanga", "taguig", "makati", "pasig", "quezon city"])

    matched_region_code = None
    matched_region_name = None

    for r_code, r_data in PH_REGIONS.items():
        for hub in r_data["cities_and_hubs"]:
            pattern = r"(?:\b|_)" + re.escape(hub) + r"(?:\b|_)"
            if re.search(pattern, loc_lower):
                matched_region_code = r_code
                matched_region_name = r_data["name"]
                is_ph = True
                break
        if matched_region_code:
            break

    return {
        "raw_location": raw_location,
        "is_philippines": is_ph,
        "region_code": matched_region_code or ("NCR" if is_ph else None),
        "region_name": matched_region_name or ("National Capital Region (NCR / Metro Manila)" if is_ph else None),
        "normalized_location": raw_location,
    }


def get_location_filter_keywords(location_key: Optional[str]) -> Tuple[bool, List[str]]:
    """
    Translates a location filter parameter into:
    (is_remote: bool, keywords: List[str])
    
    If is_remote is True, the caller should filter by remote workplace_type/location.
    Otherwise, the query should match any of the returned keywords.
    """
    if not location_key:
        return False, []

    key = location_key.strip()
    key_upper = key.upper()

    if key_upper in ["REMOTE", "WORLDWIDE REMOTE", "WORK FROM HOME", "WFH"]:
        return True, ["remote", "work from home", "wfh", "worldwide", "anywhere"]

    if key_upper in ["NCR", "METRO MANILA", "MANILA", "BGC", "TAGUIG", "MAKATI", "PASIG", "QUEZON CITY"]:
        return False, PH_REGIONS["NCR"]["cities_and_hubs"]

    if key_upper in ["REGION III", "REGION 3", "CLARK", "PAMPANGA", "CENTRAL LUZON", "ANGELES", "SUBIC"]:
        return False, PH_REGIONS["Region III"]["cities_and_hubs"]

    if key_upper in ["REGION IV-A", "REGION 4A", "CALABARZON", "LAGUNA", "CAVITE", "BATANGAS", "RIZAL"]:
        return False, PH_REGIONS["Region IV-A"]["cities_and_hubs"]

    if key_upper in ["REGION VII", "REGION 7", "CEBU", "CENTRAL VISAYAS"]:
        return False, PH_REGIONS["Region VII"]["cities_and_hubs"]

    if key_upper in ["REGION XI", "REGION 11", "DAVAO", "MINDANAO", "METRO DAVAO"]:
        mindanao_hubs = (
            PH_REGIONS["Region XI"]["cities_and_hubs"]
            + PH_REGIONS["Region X"]["cities_and_hubs"]
            + PH_REGIONS["Region XII"]["cities_and_hubs"]
            + PH_REGIONS["Region IX"]["cities_and_hubs"]
            + PH_REGIONS["Region XIII"]["cities_and_hubs"]
            + PH_REGIONS["BARMM"]["cities_and_hubs"]
            + ["mindanao"]
        )
        return False, list(dict.fromkeys(mindanao_hubs))

    if key_upper in ["REGION VI", "REGION 6", "ILOILO", "WESTERN VISAYAS", "BACOLOD"]:
        return False, PH_REGIONS["Region VI"]["cities_and_hubs"] + ["western visayas"]

    if key_upper in ["CAR", "CORDILLERA", "BAGUIO", "NORTHERN LUZON"]:
        return False, PH_REGIONS["CAR"]["cities_and_hubs"] + ["cordillera", "northern luzon"]

    # Check if key matches any of the region codes or names in PH_REGIONS
    for r_code, r_data in PH_REGIONS.items():
        if key_upper == r_code.upper() or key_upper in r_data["name"].upper():
            return False, r_data["cities_and_hubs"]

    # Generic search keyword
    return False, [key.lower()]


def get_all_philippines_keywords() -> List[str]:
    """
    Returns a unified list of all Philippine cities, business hubs, and region identifiers.
    """
    all_kws = ["philippines", "ph", "pilipinas", "remote (philippines)", "philippines (remote)"]
    for r_data in PH_REGIONS.values():
        all_kws.extend(r_data["cities_and_hubs"])
    return list(dict.fromkeys(all_kws))


def get_psoc_group_keywords(group_code: int) -> List[str]:
    """
    Returns search keywords for a specific PSOC Major Group.
    """
    clean_kws = []
    for g_code, patterns in PSOC_PATTERNS:
        if g_code == group_code:
            for p in patterns:
                kw = p.replace(r"\b", "").replace(r"\s+", " ").strip()
                if kw:
                    clean_kws.append(kw)
    return list(dict.fromkeys(clean_kws))

