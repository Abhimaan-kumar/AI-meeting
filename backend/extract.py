from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any

from groq import Groq
from openai import OpenAI

from models import TaskExtractionItem, TaskExtractionResponse


class GroqTaskExtractor:
    def __init__(self, model_name: str = "llama-3.1-8b-instant") -> None:
        self._logger = logging.getLogger(__name__)
        self._model_name = model_name
        api_key = os.getenv("GROQ_API_KEY")
        self._client = Groq(api_key=api_key) if api_key else None
        nvidia_api_key = os.getenv("NVIDIA_API_KEY") or os.getenv("OPENAI_API_KEY")
        nvidia_base_url = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
        self._nvidia_client = OpenAI(base_url=nvidia_base_url, api_key=nvidia_api_key) if nvidia_api_key else None
        self._deepseek_model = os.getenv("DEEPSEEK_MODEL", "deepseek-ai/deepseek-v3.2")
        self._critic_model = os.getenv("CRITIC_MODEL", self._deepseek_model)
        self._fallback_refiner_model = os.getenv("MISTRAL_MODEL", "mistralai/mistral-7b-instruct-v0.2")
        self._strict_mode = os.getenv("STRICT_MODE", "false").lower() == "true"

    def _prompt(self, transcript: str) -> str:
        now = datetime.now(timezone.utc).date().isoformat()
        return (
            "You are an enterprise-grade AI system that extracts actionable tasks from meeting transcripts.\n"
            "Your goal is to achieve both high precision (no junk tasks) and high recall (do not miss obvious tasks).\n\n"
            "PHASE 1 - CONTEXT UNDERSTANDING\n"
            "- Identify speakers and their statements.\n"
            "- Focus on commitments and responsibilities.\n"
            "- Clean noisy text (uh, um, etc.).\n\n"
            "PHASE 2 - TASK DETECTION\n"
            "Extract statements where a person is likely responsible for an action.\n"
            "Valid patterns: I will, I'll, X will, I can handle, I'll take care of, I'll do, and forms like 'Backend integration I'll do by Saturday'.\n"
            "Include tasks when responsibility is strongly implied even if wording is informal.\n\n"
            "PHASE 3 - FILTERING (BALANCED)\n"
            "Do not extract suggestions (we should, let's), questions (who will), vague/uncertain statements (maybe, might, if needed), or discussions without ownership.\n"
            "Do not be overly strict: keep clearly implied real tasks.\n\n"
            "PHASE 4 - NORMALIZATION\n"
            "Convert raw sentences into clean professional task titles. Keep titles short, action-oriented, and in imperative form.\n"
            "Example: Rahul will finish the UI -> Finish UI.\n"
            "Example: Backend integration I'll do -> Complete backend integration.\n\n"
            "PHASE 5 - TASK SPLITTING\n"
            "If a sentence contains multiple actions, split into separate tasks.\n"
            "Example: Rahul will finish UI and deploy by Sunday -> Finish UI; Handle deployment.\n\n"
            "PHASE 6 - ENRICHMENT\n"
            "Assignee: use speaker name if available; infer only when strongly implied; if cannot infer, discard.\n"
            "Deadline: extract natural language expressions (Friday, tomorrow, next week); if missing, leave empty.\n"
            "Priority: high for urgent/time-bound tasks, medium for normal commitments, low for optional tasks.\n\n"
            "PHASE 7 - CONFIDENCE SCORING\n"
            "- 0.9 for clear task + assignee + deadline\n"
            "- 0.75 for clear task + assignee\n"
            "- 0.6 for inferred but strong task\n"
            "Do not drop valid tasks only because confidence is not perfect.\n\n"
            "PHASE 8 - FINAL VALIDATION\n"
            "- Remove duplicate tasks.\n"
            "- Remove clearly invalid tasks.\n"
            "- Keep all meaningful tasks even if slightly imperfect.\n\n"
            "CRITICAL INSTRUCTION\n"
            "Do not miss obvious tasks. It is better to include a slightly imperfect task than to miss a real one.\n\n"
            "Do NOT miss obvious tasks even if phrasing is informal or slightly different.\n\n"
            "This meeting may contain very few tasks. Do not force extraction.\n\n"
            "If no clear commitments exist, return an empty task list.\n"
            "Do NOT generate artificial or assumed tasks.\n\n"
            "OUTPUT FORMAT (STRICT JSON ONLY):\n"
            "{\"tasks\":[{\"title\":\"clear short action\",\"description\":\"optional context\",\"assignee\":\"name\",\"deadline\":\"text or empty\",\"priority\":\"high|medium|low\",\"confidence\":0.0}]}\n\n"
            "Return ONLY JSON. No explanations.\n\n"
            f"Today is {now}.\n\n"
            f"Transcript:\n{transcript}\n"
        )

    def _is_vague_title(self, title: str) -> bool:
        cleaned = title.strip().lower()
        vague_titles = {
            "handle it",
            "do this",
            "do that",
            "take care of it",
            "follow up",
            "work on it",
            "check this",
            "fix this",
            "task",
        }
        return cleaned.rstrip(".!?") in vague_titles or len(cleaned) < 4

    def _canonical_title(self, title: str) -> str:
        cleaned = (title or "").strip().lower()
        cleaned = re.sub(r"^(?:i\s+will|i\s*'\s*ll)\s+", "", cleaned)
        cleaned = re.sub(
            r"^(?:handle|do|complete|finish|update|prepare|finalize|create|build|fix|review)\s+",
            "",
            cleaned,
        )
        cleaned = re.sub(r"\b(?:by\s+)?(?:today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+\w+)\b", "", cleaned)
        cleaned = re.sub(r"\b(?:the|a|an)\b", "", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned

    def _refinement_prompt(self, tasks: list[TaskExtractionItem]) -> str:
        tasks_payload = {
            "tasks": [
                {
                    "title": t.title,
                    "description": t.description,
                    "assignee": t.assignee,
                    "deadline": t.deadline,
                    "priority": t.priority,
                    "confidence": t.confidence,
                    "source": t.source,
                }
                for t in tasks
            ]
        }
        return (
            "You are a task refinement engine.\n\n"
            "Input is a list of extracted tasks from a meeting.\n\n"
            "Your job:\n"
            "- remove invalid or vague tasks\n"
            "- fix unclear titles\n"
            "- ensure each task has clear action and valid assignee\n"
            "- split combined tasks into separate ones\n"
            "- improve clarity and professionalism\n\n"
            "STRICT RULES:\n"
            "- remove tasks like 'handle it', 'do this'\n"
            "- remove tasks without assignee\n"
            "- split tasks joined with 'and' when they represent different actions\n"
            "- keep only high-quality actionable tasks\n"
            "- confidence should generally be >= 0.6 for strong inferred tasks\n"
            "- keep meaningful implied tasks; avoid over-pruning\n\n"
            "Return clean JSON in the same schema only.\n\n"
            f"Input:\n{json.dumps(tasks_payload, ensure_ascii=True)}"
        )

    def _finalize_tasks(self, tasks: list[TaskExtractionItem]) -> list[TaskExtractionItem]:
        filtered: list[TaskExtractionItem] = []
        seen: set[tuple[str, str]] = set()

        for task in tasks:
            title = task.title.strip()
            assignee = task.assignee.strip()
            deadline = task.deadline.strip()

            title_parts = [part.strip() for part in re.split(r"\s+and\s+", title, flags=re.IGNORECASE) if part.strip()]
            candidate_titles = title_parts if len(title_parts) > 1 else [title]

            for candidate_title in candidate_titles:
                normalized_title = candidate_title[:1].upper() + candidate_title[1:] if candidate_title else candidate_title

                if not normalized_title or not assignee:
                    continue
                if self._is_vague_title(normalized_title):
                    continue

                key = (self._canonical_title(normalized_title), assignee.lower())
                if key in seen:
                    continue

                seen.add(key)
                filtered.append(
                    TaskExtractionItem(
                        title=normalized_title,
                        description=task.description.strip(),
                        assignee=assignee,
                        deadline=deadline,
                        priority=task.priority,
                        confidence=task.confidence,
                        source=task.source.strip(),
                        is_fallback=task.is_fallback,
                    )
                )

        return filtered

    def _extract_with_groq(self, prompt: str) -> TaskExtractionResponse:
        if self._client is None:
            raise RuntimeError("GROQ_API_KEY is not set")

        response = self._client.chat.completions.create(
            model=self._model_name,
            temperature=0,
            messages=[
                {
                    "role": "system",
                    "content": "Return only valid JSON. Prioritize precision over recall. Keep only high-confidence actionable tasks.",
                },
                {"role": "user", "content": prompt},
            ],
        )
        text = (response.choices[0].message.content or "").strip()

        if text.startswith("```"):
            text = text.strip("`")
            text = text.replace("json", "", 1).strip()

        if "{" in text and "}" in text:
            start = text.find("{")
            end = text.rfind("}") + 1
            text = text[start:end]

        data = json.loads(text)
        return TaskExtractionResponse.model_validate(data)

    def _normalize_tasks_json(self, tasks_json: Any) -> dict[str, Any]:
        if isinstance(tasks_json, list):
            payload = {
                "tasks": [
                    t.model_dump() if isinstance(t, TaskExtractionItem) else t
                    for t in tasks_json
                ]
            }
        elif isinstance(tasks_json, dict):
            payload = tasks_json
        elif isinstance(tasks_json, TaskExtractionResponse):
            payload = tasks_json.model_dump()
        else:
            payload = {
                "tasks": [
                    t.model_dump() if isinstance(t, TaskExtractionItem) else t
                    for t in list(tasks_json)
                ]
            }

        if "tasks" not in payload or not isinstance(payload.get("tasks"), list):
            payload = {"tasks": []}

        return payload

    def _extract_json_segment(self, text: str) -> str:
        cleaned = text.strip()
        if not cleaned:
            raise ValueError("Empty response from model")

        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\\s*", "", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\\s*```$", "", cleaned)

        for start_char, end_char in (("{", "}"), ("[", "]")):
            start = cleaned.find(start_char)
            end = cleaned.rfind(end_char)
            if start != -1 and end != -1 and end > start:
                candidate = cleaned[start : end + 1].strip()
                try:
                    json.loads(candidate)
                    return candidate
                except json.JSONDecodeError:
                    continue

        raise ValueError("No valid JSON found in model response")

    def _parse_tasks_response(self, response_text: str) -> list[TaskExtractionItem]:
        json_text = self._extract_json_segment(response_text)
        data = json.loads(json_text)

        if isinstance(data, list):
            payload = {"tasks": data}
        elif isinstance(data, dict):
            payload = data
        else:
            raise ValueError("Model response JSON must be an object or list")

        parsed = TaskExtractionResponse.model_validate(payload)
        return parsed.tasks

    def _request_refinement(self, model: str, prompt: str, *, temperature: float = 0.15) -> str:
        if self._nvidia_client is None:
            if self._client is None:
                raise RuntimeError("NVIDIA_API_KEY is not set and GROQ_API_KEY is not set")
            response = self._client.chat.completions.create(
                model=self._model_name,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": "Return strict JSON only. No markdown."},
                    {"role": "user", "content": prompt},
                ],
            )
            content = (response.choices[0].message.content or "").strip()
            if not content:
                raise ValueError("Empty completion content")
            return content

        response = self._nvidia_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Return strict JSON only. No markdown."},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
            top_p=0.95,
            max_tokens=4096,
        )
        content = (response.choices[0].message.content or "").strip()
        if not content:
            raise ValueError("Empty completion content")
        return content

    def refine_with_deepseek(self, tasks_json: Any, transcript: str) -> list[TaskExtractionItem]:
        payload = self._normalize_tasks_json(tasks_json)
        prompt = (
            "You refine task extraction output for meetings.\\n\\n"
            "Goals:\\n"
            "- remove garbage and vague tasks\\n"
            "- keep only clear commitments with owners\\n"
            "- normalize concise action titles\\n"
            "- keep or infer deadline only when explicit\\n"
            "- preserve grounded source text\\n"
            "- return empty tasks when no commitments exist\\n\\n"
            f"Transcript:\\n{transcript}\\n\\n"
            f"Existing tasks:\\n{json.dumps(payload, ensure_ascii=True)}\\n\\n"
            "Return JSON only in schema {\"tasks\":[{title,description,assignee,deadline,priority,confidence,source}]}."
        )

        raw_response = self._request_refinement(
            model=self._deepseek_model,
            prompt=prompt,
            temperature=0.1,
        )
        return self._parse_tasks_response(raw_response)

    def refine_with_mistral(self, tasks_json: Any, transcript: str) -> list[TaskExtractionItem]:
        payload = self._normalize_tasks_json(tasks_json)
        prompt = (
            "Clean and validate tasks:\\n"
            "- remove vague tasks\\n"
            "- fix titles\\n"
            "- ensure structure\\n\\n"
            "- preserve source context for each task when possible\\n"
            "- use transcript context for disambiguation\\n\\n"
            f"Transcript:\\n{transcript}\\n\\n"
            "- if no clear commitments exist, return an empty task list\\n"
            "- do NOT generate artificial or assumed tasks\\n\\n"
            f"Input:\\n{json.dumps(payload, ensure_ascii=True)}\\n\\n"
            "Return JSON only."
        )

        raw_response = self._request_refinement(
            model=self._fallback_refiner_model,
            prompt=prompt,
            temperature=0.15,
        )
        return self._parse_tasks_response(raw_response)

    def validate_tasks(self, tasks: list[TaskExtractionItem]) -> list[TaskExtractionItem]:
        filtered: list[TaskExtractionItem] = []

        for t in tasks:
            assignee = (t.assignee or "").strip()
            if not assignee or assignee.lower() == "unassigned":
                continue
            if assignee.lower() in {"who", "what", "when", "where", "why", "how", "we", "let"}:
                continue
            if len((t.title or "").strip()) < 5:
                continue
            if t.confidence < 0.6:
                continue
            filtered.append(t)

        return filtered

    def recall_boost_extraction(
        self,
        text: str,
        existing_tasks: list[TaskExtractionItem] | None = None,
    ) -> list[TaskExtractionItem]:
        existing_tasks = existing_tasks or []
        existing_payload = {
            "tasks": [
                {
                    "title": t.title,
                    "assignee": t.assignee,
                    "deadline": t.deadline,
                    "source": t.source,
                }
                for t in existing_tasks
            ]
        }

        prompt = (
            "You are a task recovery AI.\n\n"
            "The initial extraction may have missed some tasks.\n\n"
            "From the meeting transcript below:\n"
            "- extract ANY remaining obvious tasks\n"
            "- focus on commitments: 'I will', 'I'll', 'I can handle', 'I'll do', 'X will'\n\n"
            "IMPORTANT:\n"
            "- Do not repeat already extracted tasks\n"
            "- Only return missing tasks\n"
            "- Do not include vague or suggestion-based statements\n\n"
            "Return JSON format only in schema {\"tasks\":[...]}\n\n"
            f"Already extracted tasks:\n{json.dumps(existing_payload, ensure_ascii=True)}\n\n"
            f"Transcript:\n{text}"
        )

        try:
            recovered = self._extract_with_groq(prompt).tasks
        except Exception:
            recovered = []

        regex_recovered = self._regex_commitment_extract(text)
        combined = self.merge_tasks(recovered, regex_recovered)
        return self._attach_source_context(combined, text)

    def _regex_commitment_extract(self, text: str) -> list[TaskExtractionItem]:
        tasks: list[TaskExtractionItem] = []
        lines = self._transcript_lines(text)
        last_speaker = ""

        for line in lines:
            speaker_match = re.match(r"^([A-Z][a-zA-Z]+)\s*:\s*(.+)$", line)
            speaker = speaker_match.group(1) if speaker_match else ""
            content = speaker_match.group(2).strip() if speaker_match else line
            content = re.sub(r"^also\s*,\s*", "", content, flags=re.IGNORECASE)
            if content.endswith("?") or re.match(r"^(who|what|when|where|why|how)\b", content, re.IGNORECASE):
                continue

            if speaker:
                last_speaker = speaker
            elif re.match(r"^(?:i\s+will|i\s*'\s*ll|i\s+can\s+handle|i\s*'\s*ll\s+do)\b", content, re.IGNORECASE):
                speaker = last_speaker

            assignee = ""
            title = ""
            named = re.match(r"^([A-Z][a-zA-Z]+)\s+will\s+(.+)$", content, re.IGNORECASE)
            if named:
                assignee = named.group(1)
                title = named.group(2).strip()

            first_person = re.match(r"^(?:i\s+will|i\s*'\s*ll|i\s+can\s+handle|i\s*'\s*ll\s+do)\s+(.+)$", content, re.IGNORECASE)
            if first_person and speaker:
                assignee = speaker
                title = first_person.group(1).strip()

            if not assignee or not title:
                continue
            if assignee.lower() in {"who", "what", "when", "where", "why", "how", "we", "let"}:
                continue

            tasks.append(
                TaskExtractionItem(
                    title=title[:120],
                    description=content,
                    assignee=assignee,
                    deadline="",
                    priority="medium",
                    confidence=0.75,
                    source=line,
                )
            )

        tasks = self.split_tasks(tasks)
        return self.validate_tasks(tasks)

    def critic_review(self, tasks: list[TaskExtractionItem], text: str) -> list[TaskExtractionItem]:
        payload = {
            "tasks": [
                {
                    "title": t.title,
                    "description": t.description,
                    "assignee": t.assignee,
                    "deadline": t.deadline,
                    "priority": t.priority,
                    "confidence": t.confidence,
                    "source": t.source,
                }
                for t in tasks
            ]
        }

        prompt = (
            "You are a strict AI reviewer.\n\n"
            "Given:\n"
            "1. Original meeting transcript\n"
            "2. Extracted tasks\n\n"
            "Your job:\n"
            "- identify missed tasks\n"
            "- identify incorrect tasks\n"
            "- remove vague tasks\n"
            "- fix unclear titles\n"
            "- ensure each task has assignee\n\n"
            "IMPORTANT:\n"
            "- Only include tasks with clear commitment\n"
            "- Do NOT hallucinate\n"
            "- Do NOT add suggestions or discussions\n\n"
            "Return improved JSON only in schema {\"tasks\":[...]}\n\n"
            f"Transcript:\n{text}\n\n"
            f"Extracted tasks:\n{json.dumps(payload, ensure_ascii=True)}"
        )

        try:
            raw = self._request_refinement(
                model=self._critic_model,
                prompt=prompt,
                temperature=0,
            )
            reviewed = self._parse_tasks_response(raw)
            return self._attach_source_context(reviewed, text)
        except Exception as exc:
            self._logger.warning("Critic stage failed with primary model: %s", exc)
            try:
                raw = self._request_refinement(
                    model=self._fallback_refiner_model,
                    prompt=prompt,
                    temperature=0,
                )
                reviewed = self._parse_tasks_response(raw)
                return self._attach_source_context(reviewed, text)
            except Exception:
                return tasks

    def merge_tasks(self, tasks1: list[TaskExtractionItem], tasks2: list[TaskExtractionItem]) -> list[TaskExtractionItem]:
        merged: list[TaskExtractionItem] = []
        seen: set[tuple[str, str]] = set()

        for t in [*tasks1, *tasks2]:
            title = (t.title or "").strip()
            assignee = (t.assignee or "").strip()
            if not title or not assignee:
                continue
            key = (self._canonical_title(title), assignee.lower())
            if key in seen:
                continue
            seen.add(key)
            merged.append(t)

        return merged

    def split_tasks(self, tasks: list[TaskExtractionItem]) -> list[TaskExtractionItem]:
        new_tasks: list[TaskExtractionItem] = []
        seen: set[tuple[str, str]] = set()

        for t in tasks:
            title = (t.title or "").strip()
            parts = [part.strip() for part in re.split(r"\s+and\s+", title, flags=re.IGNORECASE) if part.strip()]
            split_parts = parts if len(parts) > 1 else [title]

            for part in split_parts:
                normalized_part = re.sub(r"^(?:i\s+will|i\s*'\s*ll)\s+", "", part, flags=re.IGNORECASE).strip()
                normalized_part = normalized_part[:1].upper() + normalized_part[1:] if normalized_part else normalized_part
                key = (self._canonical_title(normalized_part or part), t.assignee.strip().lower())
                if key in seen:
                    continue
                seen.add(key)
                new_tasks.append(
                    TaskExtractionItem(
                        title=normalized_part or part,
                        description=t.description,
                        assignee=t.assignee,
                        deadline=t.deadline,
                        priority=t.priority,
                        confidence=t.confidence,
                        source=t.source,
                        is_fallback=t.is_fallback,
                    )
                )

        return new_tasks

    def _transcript_lines(self, text: str) -> list[str]:
        return [segment.strip() for segment in re.split(r"[\n\.\?\!]", text) if segment.strip()]

    def _best_source_for_task(self, title: str, transcript_lines: list[str]) -> str:
        title_tokens = {token for token in re.findall(r"[a-zA-Z0-9]+", title.lower()) if len(token) > 2}
        if not title_tokens:
            return transcript_lines[0] if transcript_lines else ""

        best_line = ""
        best_score = 0
        for line in transcript_lines:
            line_tokens = {token for token in re.findall(r"[a-zA-Z0-9]+", line.lower()) if len(token) > 2}
            score = len(title_tokens & line_tokens)
            if score > best_score:
                best_score = score
                best_line = line

        if best_line:
            return best_line
        return transcript_lines[0] if transcript_lines else ""

    def _attach_source_context(self, tasks: list[TaskExtractionItem], transcript: str) -> list[TaskExtractionItem]:
        lines = self._transcript_lines(transcript)
        output: list[TaskExtractionItem] = []

        for t in tasks:
            source = (t.source or "").strip() or self._best_source_for_task(t.title, lines)
            output.append(
                TaskExtractionItem(
                    title=t.title,
                    description=t.description,
                    assignee=t.assignee,
                    deadline=t.deadline,
                    priority=t.priority,
                    confidence=t.confidence,
                    source=source,
                    is_fallback=t.is_fallback,
                )
            )

        return output

    def fallback_extraction(self, text: str) -> list[TaskExtractionItem]:
        tasks: list[TaskExtractionItem] = []
        lines = self._transcript_lines(text)
        last_speaker = ""

        for line in lines:
            speaker_match = re.match(r"^([A-Z][a-zA-Z]+)\s*:\s*(.+)$", line)
            speaker = speaker_match.group(1) if speaker_match else ""
            content = speaker_match.group(2).strip() if speaker_match else line
            content = re.sub(r"^also\s*,\s*", "", content, flags=re.IGNORECASE)
            if speaker:
                last_speaker = speaker
            elif re.match(r"^(?:also\s*,\s*)?(?:i\s+will|i\s*'\s*ll)\b", content, re.IGNORECASE):
                speaker = last_speaker

            assignee = ""
            title = ""

            m_named = re.match(r"^([A-Z][a-zA-Z]+)\s+will\s+(.+)$", content, re.IGNORECASE)
            if m_named:
                assignee = m_named.group(1)
                title = m_named.group(2).strip()

            m_i = re.match(r"^(?:i\s+will|i\s*'\s*ll)\s+(.+)$", content, re.IGNORECASE)
            if m_i and speaker:
                assignee = speaker
                title = m_i.group(1).strip()

            if not assignee or not title:
                continue

            tasks.append(
                TaskExtractionItem(
                    title=title[:120],
                    description=content,
                    assignee=assignee,
                    deadline="",
                    priority="medium",
                    confidence=0.6,
                    source=line,
                    is_fallback=False,
                )
            )

        tasks = self.split_tasks(tasks)
        tasks = self.validate_tasks(tasks)
        tasks = self._finalize_tasks(tasks)
        if tasks:
            return tasks

        if self._strict_mode:
            return []

        return [
            TaskExtractionItem(
                title="No clear actionable tasks identified",
                description="System fallback: no grounded commitments were detected in transcript",
                assignee="",
                deadline="",
                priority="low",
                confidence=0.5,
                source="system_fallback",
                is_fallback=True,
            )
        ]

    def process_meeting(self, text: str) -> list[TaskExtractionItem]:
        prompt = self._prompt(text)

        # Stage 1: Groq extraction
        try:
            tasks = self._extract_with_groq(prompt).tasks
        except Exception as exc:
            self._logger.warning("Groq extraction failed, using heuristic fallback: %s", exc)
            tasks = self._heuristic_extract(text)

        # Stage 2: DeepSeek refinement (NVIDIA-hosted)
        try:
            tasks = self.refine_with_deepseek(tasks, text)
        except Exception as exc:
            self._logger.warning("DeepSeek refinement failed, using fallback refiner: %s", exc)
            try:
                tasks = self.refine_with_mistral(tasks, text)
            except Exception:
                self._logger.warning("Fallback refinement failed; continuing with extracted tasks")

        # Stage 3: Critic self-correction
        tasks = self.critic_review(tasks, text)

        # Stage 4: Split + validate + finalize
        tasks = self._attach_source_context(tasks, text)
        tasks = self.split_tasks(tasks)
        tasks = self.validate_tasks(tasks)
        finalized = self._finalize_tasks(tasks)
        if finalized:
            return finalized

        # Stage 5: Demo-safe fallback
        return self.fallback_extraction(text)

    def _refine_tasks_with_groq(self, tasks: list[TaskExtractionItem]) -> list[TaskExtractionItem]:
        if not tasks:
            return []

        try:
            refined = self._extract_with_groq(self._refinement_prompt(tasks))
            return refined.tasks
        except Exception:
            return tasks

    def _heuristic_extract(self, transcript: str) -> list[TaskExtractionItem]:
        tasks: list[TaskExtractionItem] = []
        lines = [part.strip() for part in re.split(r"[\n\.\?\!]", transcript) if part.strip()]
        last_speaker = ""

        for line in lines:
            normalized_line = re.sub(r"^(uh|um|hmm|ah|er)\s+", "", line.strip(), flags=re.IGNORECASE)
            lower = normalized_line.lower()
            if lower.startswith(("who ", "what ", "why ", "when ", "how ")):
                continue

            speaker_match = re.match(r"^([A-Z][a-zA-Z]+)\s*:\s*(.+)$", normalized_line)
            speaker = speaker_match.group(1) if speaker_match else ""
            content = speaker_match.group(2).strip() if speaker_match else normalized_line
            content = re.sub(r"^also\s*,\s*", "", content, flags=re.IGNORECASE)
            if speaker:
                last_speaker = speaker
            elif re.match(r"^(?:also\s*,\s*)?(?:i\s+will|i\s*'\s*ll)\b", content, re.IGNORECASE):
                speaker = last_speaker
            lower_content = content.lower()

            if not any(token in lower_content for token in ["i'll", "i will", "will", "can help", "can handle", "going to", "plans to", "let me"]):
                continue

            assignee = ""
            title = content

            if speaker and any(
                token in lower_content
                for token in ["i'll", "i will", "can help", "can handle", "going to", "plans to", "let me"]
            ):
                assignee = speaker
                if re.match(r"^i\s+can\s+help\s+with\s+", content, re.IGNORECASE):
                    title = re.sub(r"^i\s+can\s+help\s+with\s+", "Assist with ", content, flags=re.IGNORECASE)
                elif re.match(r"^i\s+can\s+handle\s+", content, re.IGNORECASE):
                    title = re.sub(r"^i\s+can\s+handle\s+", "Handle ", content, flags=re.IGNORECASE)
                elif re.match(r"^let\s+me\s+", content, re.IGNORECASE):
                    title = re.sub(r"^let\s+me\s+", "", content, flags=re.IGNORECASE)
                elif re.match(r"^(.+?)\s+i\s*'\s*ll\s+do(?:\s+by\s+.+)?$", content, re.IGNORECASE):
                    m2 = re.match(r"^(.+?)\s+i\s*'\s*ll\s+do(?:\s+by\s+.+)?$", content, re.IGNORECASE)
                    prefix = (m2.group(1).strip() if m2 else content).rstrip(" ,")
                    title = f"Complete {prefix.lower()}"
                else:
                    title = re.sub(r"^(i\s*'\s*ll|i\s+will|i\s+am\s+going\s+to|i\s+plan\s+to)\s+", "", content, flags=re.IGNORECASE)

            m = re.match(r"^([A-Z][a-zA-Z]+)\s+(will|can|is\s+going\s+to|plans\s+to)\s+(.+)$", content, re.IGNORECASE)
            if m:
                assignee = m.group(1)
                title = m.group(3).strip()

            if assignee.lower() in {"who", "what", "when", "where", "why", "how", "we", "let"}:
                continue

            if not assignee:
                continue

            deadline_match = re.search(
                r"\b(today|tomorrow|tonight|friday|monday|tuesday|wednesday|thursday|saturday|sunday|next\s+\w+)\b",
                content,
                re.IGNORECASE,
            )
            deadline = deadline_match.group(1) if deadline_match else ""

            priority = "medium"
            if deadline or any(token in lower for token in ["urgent", "asap", "critical", "today", "tomorrow"]):
                priority = "high"
            elif any(token in lower for token in ["later", "whenever", "eventually"]):
                priority = "low"

            cleaned_title = title[:1].upper() + title[1:] if title else "Task"
            tasks.append(
                TaskExtractionItem(
                    title=cleaned_title[:120],
                    description=content,
                    assignee=assignee,
                    deadline=deadline,
                    priority=priority,
                    confidence=0.8 if not deadline else 0.9,
                    source=normalized_line,
                )
            )

        return tasks

    def extract_tasks(self, transcript: str) -> list[TaskExtractionItem]:
        return self.process_meeting(transcript)
