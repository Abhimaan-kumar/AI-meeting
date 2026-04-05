import json

import requests


tests = [
    (
        "basic_two_commitments",
        "Rahul: I'll complete backend API integration by Saturday. Also, I'll handle deployment before Sunday.",
    ),
    (
        "suggestion_noise",
        "Priya: we should maybe improve docs later. Team: let's think about redesign next quarter.",
    ),
    (
        "mixed_commitment_and_question",
        "Aman: I can handle QA checklist tomorrow. Who will schedule the retro?",
    ),
    (
        "multi_speaker_clear",
        "Neha: I'll prepare release notes by Friday. Arjun: I will finalize DB migration by Monday.",
    ),
    (
        "informal_phrase",
        "Karan: backend integration I'll do by Saturday.",
    ),
    (
        "combined_actions",
        "Riya: I'll finish UI and deploy by Sunday.",
    ),
    (
        "uncertain_language",
        "Maybe I might handle testing if needed.",
    ),
    (
        "speaker_carryover",
        "Rahul: I'll complete API docs by Friday. Also, I'll update runbook before Sunday.",
    ),
    (
        "named_will_pattern",
        "Sonia will prepare client deck by Tuesday.",
    ),
    (
        "messy_fillers",
        "Um Rahul: I'll do auth fixes tomorrow. Hmm we should maybe revisit architecture. Also, I'll handle deployment.",
    ),
]


results = []
for name, text in tests:
    try:
        response = requests.post(
            "http://localhost:8000/process-text",
            json={"text": text},
            timeout=30,
        )
        response.raise_for_status()
        tasks = response.json().get("tasks", [])
        results.append(
            {
                "name": name,
                "count": len(tasks),
                "titles": [t.get("title") for t in tasks],
                "assignees": [t.get("assignee") for t in tasks],
            }
        )
    except Exception as exc:
        results.append({"name": name, "count": -1, "error": str(exc)})

print(json.dumps(results, indent=2))
