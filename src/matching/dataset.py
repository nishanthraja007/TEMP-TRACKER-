"""Synthetic dataset of 1,000 realistic investor and mentor candidates for matching."""

import random
from typing import List
from src.matching.models import InvestorCandidate

INDUSTRIES = [
    "HealthTech",
    "AI/ML",
    "FinTech",
    "SaaS",
    "CleanTech",
    "EdTech",
    "DeepTech",
    "E-commerce",
]

STAGES = ["Idea / Pre-Seed", "Seed", "Series A", "Series B / Growth"]

GEOGRAPHIES = [
    "Global",
    "North America",
    "Asia-Pacific",
    "Europe",
    "India",
    "Southeast Asia",
]

TOP_FIRMS = [
    ("Sequoia Capital Horizon", "Roelof Botha", ["AI/ML", "HealthTech", "SaaS"], ["Seed", "Series A"], 500_000, 5_000_000, ["Global", "North America", "Asia-Pacific"], "Focusing on transformative generative AI and precision healthcare systems solving massive friction.", ["Apple", "Stripe", "Unity", "Nuance"]),
    ("Andreessen Horowitz Bio+Health", "Vijay Pande", ["HealthTech", "AI/ML", "DeepTech"], ["Seed", "Series A", "Series B / Growth"], 750_000, 10_000_000, ["Global", "North America"], "Investing at the convergence of machine learning, biology, and clinical workflow transformation.", ["Freenome", "Insitro", "BioAge", "Devoted"]),
    ("Accel Velocity Partners", "Sameer Gandhi", ["FinTech", "SaaS", "AI/ML"], ["Seed", "Series A"], 400_000, 4_000_000, ["Global", "Asia-Pacific", "Europe"], "Early believers in software founders rethinking enterprise automation and financial rails.", ["Atlassian", "Slack", "Freshworks", "UiPath"]),
    ("Khosla Ventures Frontier", "Vinod Khosla", ["DeepTech", "HealthTech", "CleanTech", "AI/ML"], ["Idea / Pre-Seed", "Seed", "Series A"], 250_000, 6_000_000, ["Global", "North America", "India"], "Backing audacious technical ideas with huge potential to positively impact humanity and medicine.", ["OpenAI", "DoorDash", "Square", "Guardant Health"]),
    ("Nexus Venture Partners", "Jishnu Bhattacharjee", ["AI/ML", "SaaS", "HealthTech"], ["Seed", "Series A"], 500_000, 4_500_000, ["Asia-Pacific", "India", "North America", "Global"], "Pioneers in US-India cross-border enterprise software and AI intelligence pipelines.", ["Postman", "Hasura", "Apollo.io", "MinIO"]),
    ("Lightspeed Health & AI", "Ling Wong", ["HealthTech", "AI/ML"], ["Seed", "Series A"], 600_000, 5_000_000, ["Global", "North America"], "Partnering with visionary founders building diagnostic platforms and AI-enabled clinical agents.", ["Guardant", "Personalis", "Epic", "Zocdoc"]),
    ("General Catalyst HealthCatalyst", "Hemant Taneja", ["HealthTech", "FinTech", "SaaS"], ["Seed", "Series A", "Series B / Growth"], 1_000_000, 12_000_000, ["Global", "North America", "Europe"], "Creating unbundled, value-based healthcare ecosystems through AI, data, and patient-first software.", ["Livongo", "Oscar Health", "Commure", "Stripe"]),
    ("Bessemer Venture Tech Fund", "Byron Deeter", ["SaaS", "AI/ML", "FinTech"], ["Seed", "Series A"], 500_000, 6_000_000, ["Global", "North America", "Europe"], "Data-driven roadmaps supporting category-defining cloud and AI infrastructure pioneers.", ["Twilio", "Shopify", "LinkedIn", "Pinterest"]),
    ("Founders Fund Frontier", "Brian Singerman", ["DeepTech", "HealthTech", "AI/ML"], ["Seed", "Series A", "Series B / Growth"], 500_000, 15_000_000, ["Global", "North America"], "Investing in tough technological problems rather than incremental consumer widgets.", ["SpaceX", "Palantir", "Anduril", "Stemcentrx"]),
    ("Matrix Partners Early Stage", "Avnish Bajaj", ["FinTech", "AI/ML", "SaaS", "HealthTech"], ["Idea / Pre-Seed", "Seed"], 200_000, 2_500_000, ["Asia-Pacific", "India", "Global"], "Founder-first seed capital for technical leaders scaling high-growth market innovations.", ["Ola", "Razorpay", "Country Delight", "Five Star"]),
    ("Elevation Capital Catalyst", "Mukul Arora", ["FinTech", "HealthTech", "EdTech"], ["Seed", "Series A"], 500_000, 5_000_000, ["Asia-Pacific", "India"], "Decade-long partners to bold founders building consumer and enterprise cornerstones.", ["Paytm", "Swiggy", "Urban Company", "ShareChat"]),
    ("Y-Combinator Alumni Angel Syndicate", "Garry Tan", ["AI/ML", "SaaS", "HealthTech", "FinTech", "CleanTech"], ["Idea / Pre-Seed", "Seed"], 100_000, 1_500_000, ["Global", "North America", "Asia-Pacific", "Europe"], "First-cheque community backing the top technical entrepreneurs building high-velocity MVPs.", ["Airbnb", "Dropbox", "Coinbase", "Ginkgo Bioworks"]),
]

FIRST_NAMES = [
    "Aravind", "Priya", "Vikram", "Elena", "Marcus", "Siddharth", "Sophia", "Alexander",
    "Meera", "David", "Ananya", "Rohan", "Chloe", "Karthik", "Rachel", "Ethan", "Sarah",
    "Mateo", "Nandita", "Daniel", "Deepa", "Julian", "Fatima", "Chen", "Tara", "Lucas"
]

LAST_NAMES = [
    "Natarajan", "Menon", "Kapoor", "Vance", "Chen", "Gupta", "Goldman", "Venkatesh",
    "Sengupta", "Dubois", "Patel", "Kowalski", "Sharma", "Bauer", "Sundaram", "O'Connor",
    "Iyer", "Castillo", "Rao", "Schneider", "Verma", "Takahashi", "Al-Mansoor", "Zhao"
]

FIRM_PREFIXES = [
    "Aura", "Vertex", "Summit", "Catalyst", "Prism", "Beacon", "Nexus", "Foundry",
    "Starlight", "Horizon", "Pinnacle", "Quantum", "Vanguard", "Frontier", "Crestview",
    "BlueShift", "Hyperplane", "Synapse", "Omni", "Terra", "AlphaGate", "Meridian"
]

FIRM_SUFFIXES = [
    "Ventures", "Capital", "Partners", "Fund", "Holdings", "Innovations", "Syndicate", "Labs"
]

SAMPLE_KEYWORDS = {
    "HealthTech": ["diagnostic", "clinical", "radiology", "imaging", "oncology", "patient", "biotech", "HIPAA", "hospital", "telehealth", "precision medicine"],
    "AI/ML": ["neural", "transformer", "agent", "deep learning", "computer vision", "multimodal", "NLP", "inference", "foundation model", "autonomous"],
    "FinTech": ["payment", "neobank", "ledger", "credit", "underwriting", "fraud", "defi", "banking", "treasury", "cross-border", "capital"],
    "SaaS": ["workflow", "enterprise", "productivity", "b2b", "cloud", "collaboration", "analytics", "dashboard", "api", "crm"],
    "CleanTech": ["carbon", "renewable", "solar", "battery", "grid", "hydrogen", "energy storage", "circular economy", "electrification"],
    "EdTech": ["adaptive learning", "upskilling", "k12", "curriculum", "tutor", "lms", "classroom", "gamification"],
    "DeepTech": ["quantum", "robotics", "semiconductor", "photonics", "aerospace", "materials", "synthetic biology"],
    "E-commerce": ["marketplace", "omnichannel", "supply chain", "d2c", "fulfillment", "logistics", "retail tech"],
}


def generate_candidate_pool(count: int = 1000) -> List[InvestorCandidate]:
    """Generates a deterministic pool of 1,000 investor candidates."""
    # Seed for reproducibility
    rng = random.Random(42)
    candidates: List[InvestorCandidate] = []

    # 1. Add curated prominent tier-1 benchmark investors
    for idx, (firm, partner, industries, stages, min_c, max_c, geos, thesis, ports) in enumerate(TOP_FIRMS):
        candidate = InvestorCandidate(
            id=f"INV-{1000 + idx}",
            name=f"{partner} ({firm})",
            firm=firm,
            partner_name=partner,
            avatar_url=f"https://images.unsplash.com/photo-{1534528741775 + idx * 1000}?auto=format&fit=crop&w=256&q=80",
            focus_industries=industries,
            investment_stages=stages,
            min_check_usd=float(min_c),
            max_check_usd=float(max_c),
            target_geographies=geos,
            portfolio_count=len(ports) + rng.randint(15, 60),
            dry_powder_usd=float(rng.randint(50, 450) * 1_000_000),
            thesis=thesis,
            key_investments=ports,
            lead_investor=True,
            rating=round(rng.uniform(4.7, 5.0), 2),
        )
        candidates.append(candidate)

    # 2. Procedurally generate the remaining candidates up to count
    existing_count = len(candidates)
    for i in range(existing_count, count):
        partner = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
        firm = f"{rng.choice(FIRM_PREFIXES)} {rng.choice(FIRM_SUFFIXES)}"
        
        # Pick 1-3 industries
        k_ind = rng.choices([1, 2, 3], weights=[0.45, 0.40, 0.15])[0]
        selected_industries = rng.sample(INDUSTRIES, k_ind)
        
        # Pick stages
        k_stg = rng.choices([1, 2, 3], weights=[0.5, 0.35, 0.15])[0]
        selected_stages = rng.sample(STAGES, k_stg)
        
        # Ticket sizes based on stage
        if "Idea / Pre-Seed" in selected_stages:
            min_c = rng.choice([25_000, 50_000, 100_000])
            max_c = rng.choice([250_000, 500_000, 1_000_000])
        elif "Seed" in selected_stages:
            min_c = rng.choice([100_000, 250_000, 500_000])
            max_c = rng.choice([1_000_000, 2_000_000, 3_500_000])
        elif "Series A" in selected_stages:
            min_c = rng.choice([500_000, 1_000_000, 2_000_000])
            max_c = rng.choice([4_000_000, 7_000_000, 10_000_000])
        else:
            min_c = rng.choice([2_000_000, 5_000_000])
            max_c = rng.choice([12_000_000, 25_000_000])

        # Geographies
        k_geo = rng.choices([1, 2, 3], weights=[0.5, 0.35, 0.15])[0]
        selected_geos = rng.sample(GEOGRAPHIES, k_geo)

        # Build thesis sentence with sector keywords
        kw_list = []
        for ind in selected_industries:
            kw_list.extend(rng.sample(SAMPLE_KEYWORDS[ind], min(2, len(SAMPLE_KEYWORDS[ind]))))
        
        thesis = (
            f"Actively seeking early-stage technical teams in {', '.join(selected_industries)}. "
            f"We emphasize {' and '.join(kw_list)} with defensible unit economics and global scalability."
        )

        candidate = InvestorCandidate(
            id=f"INV-{1000 + i}",
            name=f"{partner} ({firm})",
            firm=firm,
            partner_name=partner,
            avatar_url=None,
            focus_industries=selected_industries,
            investment_stages=selected_stages,
            min_check_usd=float(min_c),
            max_check_usd=float(max_c),
            target_geographies=selected_geos,
            portfolio_count=rng.randint(6, 45),
            dry_powder_usd=float(rng.randint(10, 150) * 1_000_000),
            thesis=thesis,
            key_investments=[f"PortfolioCo {rng.randint(1, 99)}", f"AlphaTech {rng.randint(1, 50)}"],
            lead_investor=rng.random() > 0.3,
            rating=round(rng.uniform(4.0, 4.9), 1),
        )
        candidates.append(candidate)

    return candidates


# Singleton in-memory pool
CANDIDATE_POOL: List[InvestorCandidate] = generate_candidate_pool(1000)
