from typing import Dict, List, Optional

# Standardized skill canonical mapping
SYNONYM_MAP: Dict[str, str] = {
    # Frontend
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ecmascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "react": "React",
    "react.js": "React",
    "reactjs": "React",
    "next": "Next.js",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "vue": "Vue.js",
    "vue.js": "Vue.js",
    "vuejs": "Vue.js",
    "angular": "Angular",
    "angularjs": "Angular",
    "html": "HTML5",
    "html5": "HTML5",
    "css": "CSS3",
    "css3": "CSS3",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "redux": "Redux",
    "zustand": "Zustand",
    
    # Backend
    "py": "Python",
    "python": "Python",
    "python3": "Python",
    "node": "Node.js",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "express": "Express.js",
    "express.js": "Express.js",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "go": "Go",
    "golang": "Go",
    "rust": "Rust",
    "java": "Java",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "c#": "C#",
    ".net": ".NET",
    "dotnet": ".NET",
    "ruby": "Ruby",
    "rails": "Ruby on Rails",
    "ruby on rails": "Ruby on Rails",
    "php": "PHP",
    "laravel": "Laravel",
    "larave": "Laravel",
    "larvel": "Laravel",
    "rest": "REST API",
    "rest api": "REST API",
    "restful": "REST API",
    "graphql": "GraphQL",
    "grpc": "gRPC",
    "websockets": "WebSockets",
    
    # Database
    "sql": "SQL",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "psql": "PostgreSQL",
    "mysql": "MySQL",
    "mariadb": "MariaDB",
    "sqlite": "SQLite",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "dynamodb": "DynamoDB",
    "supabase": "Supabase",
    "prisma": "Prisma",
    "drizzle": "Drizzle ORM",
    "sqlalchemy": "SQLAlchemy",
    
    # DevOps & Cloud
    "devops": "DevOps",
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "docker": "Docker",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "Google Cloud Platform (GCP)",
    "google cloud": "Google Cloud Platform (GCP)",
    "azure": "Microsoft Azure",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "github actions": "GitHub Actions",
    "linux": "Linux",
    "bash": "Bash / Shell",
    "terraform": "Terraform",
    
    # Testing & Architecture
    "jest": "Jest",
    "vitest": "Vitest",
    "pytest": "pytest",
    "playwright": "Playwright",
    "cypress": "Cypress",
    "unit testing": "Unit Testing",
    "system design": "System Design",
    "microservices": "Microservices",
    "agile": "Agile / Scrum",
    "scrum": "Agile / Scrum",
    
    # AI / Data
    "llm": "LLMs",
    "llms": "LLMs",
    "rag": "RAG (Retrieval-Augmented Generation)",
    "prompt engineering": "Prompt Engineering",
    "langchain": "LangChain",
    "openai api": "OpenAI API",
    "gemini api": "Gemini API",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "pandas": "Pandas",
    "numpy": "NumPy"
}

CATEGORY_MAP: Dict[str, str] = {
    "JavaScript": "Frontend",
    "TypeScript": "Frontend",
    "React": "Frontend",
    "Next.js": "Frontend",
    "Vue.js": "Frontend",
    "Angular": "Frontend",
    "HTML5": "Frontend",
    "CSS3": "Frontend",
    "Tailwind CSS": "Frontend",
    "Redux": "Frontend",
    "Zustand": "Frontend",
    
    "Python": "Backend",
    "Node.js": "Backend",
    "FastAPI": "Backend",
    "Express.js": "Backend",
    "Django": "Backend",
    "Flask": "Backend",
    "Go": "Backend",
    "Rust": "Backend",
    "Java": "Backend",
    "Spring Boot": "Backend",
    "C#": "Backend",
    ".NET": "Backend",
    "PHP": "Backend",
    "Laravel": "Backend",
    "REST API": "Backend",
    "GraphQL": "Backend",
    "gRPC": "Backend",
    "WebSockets": "Backend",
    
    "SQL": "Database",
    "PostgreSQL": "Database",
    "MySQL": "Database",
    "MariaDB": "Database",
    "SQLite": "Database",
    "MongoDB": "Database",
    "Redis": "Database",
    "DynamoDB": "Database",
    "Supabase": "Database",
    "Prisma": "Database",
    "SQLAlchemy": "Database",
    
    "Git": "DevOps",
    "GitHub": "DevOps",
    "Docker": "DevOps",
    "Kubernetes": "DevOps",
    "AWS": "Cloud",
    "Google Cloud Platform (GCP)": "Cloud",
    "Microsoft Azure": "Cloud",
    "CI/CD": "DevOps",
    "GitHub Actions": "DevOps",
    "Linux": "DevOps",
    "Terraform": "DevOps",
    
    "Jest": "Testing",
    "Vitest": "Testing",
    "pytest": "Testing",
    "Playwright": "Testing",
    "Cypress": "Testing",
    "Unit Testing": "Testing",
    
    "System Design": "Architecture",
    "Microservices": "Architecture",
    "Agile / Scrum": "Methodology",
    
    "LLMs": "AI",
    "RAG (Retrieval-Augmented Generation)": "AI",
    "Prompt Engineering": "AI",
    "LangChain": "AI",
    "OpenAI API": "AI",
    "Gemini API": "AI",
}


def normalize_skill_name(raw_name: str) -> str:
    """
    Resolves skill synonyms to their canonical standardized taxonomy name.
    e.g. 'react.js' -> 'React', 'k8s' -> 'Kubernetes', 'postgres' -> 'PostgreSQL'
    """
    if not raw_name:
        return ""
    clean = raw_name.strip().lower()
    return SYNONYM_MAP.get(clean, raw_name.strip())


def get_skill_category(skill_name: str) -> str:
    canonical = normalize_skill_name(skill_name)
    return CATEGORY_MAP.get(canonical, "General")


def extract_skills_from_text(text: str, extra_keywords: Optional[List[str]] = None) -> List[str]:
    """
    Extracts canonical skill names dynamically from job text or user keywords.
    Matches against known technology taxonomy and preserves specific user keywords.
    """
    if not text:
        text = ""
    
    extracted = set()
    # Replace punctuation like dashes/slashes with spaces to catch compound inputs like 'Larave-php'
    text_lower = text.lower().replace("-", " ").replace("/", " ")

    # 1. Match known skills from SYNONYM_MAP
    import re
    for synonym, canonical in SYNONYM_MAP.items():
        # Match as whole word/token to prevent false partial matches (e.g. 'go' in 'good')
        pattern = r"(?:\b|_)" + re.escape(synonym) + r"(?:\b|_)"
        if re.search(pattern, text_lower):
            extracted.add(canonical)

    # 2. Add extra keywords directly as skills if provided
    if extra_keywords:
        for kw in extra_keywords:
            cleaned = kw.strip()
            if cleaned:
                for sub in cleaned.replace("-", " ").replace("/", " ").split():
                    canon = normalize_skill_name(sub)
                    extracted.add(canon)

    return list(extracted)


CURRENCY_SYMBOLS: Dict[str, str] = {
    "PHP": "₱",
    "USD": "$",
    "SGD": "S$",
    "EUR": "€",
    "GBP": "£",
    "JPY": "¥",
    "CAD": "CA$",
    "AUD": "AU$",
    "MYR": "RM",
    "IDR": "Rp",
}


def normalize_currency(curr_str: Optional[str]) -> str:
    """
    Normalizes arbitrary currency strings or symbols to ISO 4217 code.
    Defaults to 'USD', with native support for Philippine Peso ('PHP' / '₱').
    """
    if not curr_str:
        return "USD"
    c = curr_str.strip().upper()
    if c in ("PHP", "₱", "PHP.", "PESO", "PESOS", "PHILIPPINE PESO", "PH"):
        return "PHP"
    if c in ("USD", "$", "US$", "DOLLAR", "DOLLARS"):
        return "USD"
    if c in ("SGD", "S$", "SINGAPORE DOLLAR"):
        return "SGD"
    if c in ("EUR", "€", "EURO"):
        return "EUR"
    if c in ("GBP", "£", "POUND"):
        return "GBP"
    if c in ("MYR", "RM", "RINGGIT"):
        return "MYR"
    if c in ("IDR", "RP", "RUPIAH"):
        return "IDR"
    return c if len(c) == 3 else "USD"


CURRENCY_FLAGS: Dict[str, str] = {
    "PHP": "🇵🇭",
    "USD": "🇺🇸",
    "SGD": "🇸🇬",
    "EUR": "🇪🇺",
    "GBP": "🇬🇧",
    "JPY": "🇯🇵",
    "CAD": "🇨🇦",
    "AUD": "🇦🇺",
    "MYR": "🇲🇾",
    "IDR": "🇮🇩",
}


def get_currency_symbol(curr_code: Optional[str]) -> str:
    if not curr_code:
        return "$"
    return CURRENCY_SYMBOLS.get(curr_code.upper(), "$")


def get_currency_flag(curr_code: Optional[str]) -> str:
    if not curr_code:
        return "🇵🇭"
    return CURRENCY_FLAGS.get(curr_code.upper(), "🌐")



