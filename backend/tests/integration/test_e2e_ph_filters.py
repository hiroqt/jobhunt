import asyncio
import httpx

API_BASE = "http://localhost:8000/api"
SESSION_ID = "guest_e2e_ph_test"
HEADERS = {
    "Content-Type": "application/json",
    "X-Session-ID": SESSION_ID
}

async def run_e2e_test():
    print("=== STARTING COMPREHENSIVE E2E VERIFICATION ===")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Test Sources List
        print("\n[1] Verifying Connected Job Sources...")
        r = await client.get(f"{API_BASE}/sources", headers=HEADERS)
        assert r.status_code == 200, f"Failed /sources: {r.text}"
        sources = r.json()
        source_names = [s["source_name"] for s in sources]
        print(f"Registered sources count: {len(sources)}")
        for s in sources:
            print(f"  ✓ {s['display_name']} ({s['source_name']}) - Status: {s['status']}")
        for expected in ["jobstreet", "kalibrr", "onlinejobs", "bossjob", "philjobnet", "linkedin", "indeed", "remoteok"]:
            assert expected in source_names, f"Expected {expected} in sources list"

        # 2. Test Candidate Profile
        print("\n[2] Checking Candidate Profile...")
        r = await client.get(f"{API_BASE}/candidate", headers=HEADERS)
        assert r.status_code == 200
        candidate = r.json()
        print(f"Candidate: {candidate['full_name']} | Target roles: {candidate['target_roles']}")

        # 3. Create Search Configuration with Philippine Job Platforms
        print("\n[3] Creating Search Configuration with Philippine Job Platforms...")
        search_payload = {
            "name": "🇵🇭 PH Full Stack & Remote Developer Search",
            "sources": [
                "jobstreet",
                "kalibrr",
                "onlinejobs",
                "bossjob",
                "philjobnet",
                "linkedin",
                "indeed",
                "remoteok"
            ],
            "keywords": ["Laravel", "React", "TypeScript", "Python"],
            "locations": ["Philippines", "Metro Manila", "Cebu", "Remote"],
            "remote_types": ["Remote"],
            "employment_types": ["Full-time"],
            "experience_levels": ["Junior", "Entry Level"],
            "salary_min": 50000,
            "salary_max": 95000,
            "currency": "PHP",
            "schedule_frequency": "DAILY",
            "enabled": True
        }
        r = await client.post(f"{API_BASE}/searches", json=search_payload, headers=HEADERS)
        assert r.status_code in (200, 201), f"Failed creating search: {r.text}"
        search = r.json()
        search_id = search["id"]
        print(f"  ✓ Created search: '{search['name']}' (ID: {search_id})")
        print(f"    Target sources: {search['sources']}")

        # 4. Trigger Discovery Execution
        print("\n[4] Triggering Automated Discovery Execution...")
        r = await client.post(f"{API_BASE}/searches/{search_id}/run", headers=HEADERS)
        assert r.status_code in (200, 201), f"Failed running search: {r.text}"
        run_res = r.json()
        print(f"  ✓ Discovery Run: {run_res['status']} | Discovered: {run_res['jobs_discovered']} jobs")

        # 5. Verify Jobs List
        print("\n[5] Querying All Discovered Jobs...")
        r = await client.get(f"{API_BASE}/jobs", headers=HEADERS)
        assert r.status_code == 200
        all_jobs = r.json()
        print(f"  Total jobs in explorer: {len(all_jobs)}")
        assert len(all_jobs) > 0, "Expected discovered jobs to be populated"
        for j in all_jobs[:5]:
            print(f"    - [{j['source']}] {j['title']} at {j['company']} ({j.get('location')}) - Score: {j.get('match_score')}%")

        # 6. Test Philippines Only Filter
        print("\n[6] Testing 'Philippines Only' Filter (ph_only=true)...")
        r = await client.get(f"{API_BASE}/jobs?ph_only=true", headers=HEADERS)
        assert r.status_code == 200
        ph_jobs = r.json()
        print(f"  ✓ Total Philippine jobs returned: {len(ph_jobs)}")
        assert len(ph_jobs) > 0
        for j in ph_jobs:
            is_ph_src = j["source"].lower() in ["jobstreet", "kalibrr", "onlinejobs", "bossjob", "philjobnet"]
            is_ph_loc = any(k in (j.get("location") or "").lower() for k in ["philippines", "manila", "cebu", "davao", "taguig", "makati", "bgc", "clark", "laguna", "pampanga"])
            is_php = j.get("currency") == "PHP"
            assert is_ph_src or is_ph_loc or is_php, f"Job {j['title']} not recognized as PH: source={j['source']}, loc={j['location']}, curr={j['currency']}"
        print("  ✓ All returned jobs strictly conform to Philippine locations, employers, or currency.")

        # 7. Test Individual Platform Filters
        print("\n[7] Testing Individual Source Filters...")
        for src in ["jobstreet", "kalibrr", "onlinejobs", "bossjob", "philjobnet"]:
            r = await client.get(f"{API_BASE}/jobs?source={src}", headers=HEADERS)
            assert r.status_code == 200
            src_jobs = r.json()
            print(f"  ✓ Source '{src}': {len(src_jobs)} jobs found")
            for j in src_jobs:
                assert j["source"].lower() == src.lower()

        # 8. Test Location Sub-district Filters
        print("\n[8] Testing Location Sub-district Filters...")
        for loc in ["Cebu", "Taguig", "Makati", "Remote"]:
            r = await client.get(f"{API_BASE}/jobs?location={loc}", headers=HEADERS)
            assert r.status_code == 200
            loc_jobs = r.json()
            print(f"  ✓ Location filter '{loc}': {len(loc_jobs)} jobs returned")

        print("\n=== ALL E2E API AND FILTER VERIFICATIONS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(run_e2e_test())
