"""Optional LLM client for nuanced parsing — plug in free API later."""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from .config import OrchestratorSettings

log = logging.getLogger(__name__)


class LLMClient:
    """OpenAI-compatible chat completions (Groq, OpenRouter, Ollama, etc.)."""

    def __init__(self, settings: OrchestratorSettings):
        self._enabled = settings.llm_enabled and bool(settings.llm_api_url)
        self._url = settings.llm_api_url.rstrip("/")
        self._key = settings.llm_api_key
        self._model = settings.llm_model

    @property
    def enabled(self) -> bool:
        return self._enabled

    async def complete_json(self, system: str, user: str) -> dict[str, Any] | None:
        if not self._enabled:
            return None

        endpoint = f"{self._url}/chat/completions"
        if "/v1" not in self._url and not self._url.endswith("/chat/completions"):
            endpoint = f"{self._url}/v1/chat/completions"

        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
        }
        headers = {"Authorization": f"Bearer {self._key}", "Content-Type": "application/json"}

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                r = await client.post(endpoint, json=payload, headers=headers)
                r.raise_for_status()
                data = r.json()
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
        except Exception:
            log.exception("LLM call failed")
            return None

    async def enrich_transcript(self, raw_summary: str) -> dict[str, Any] | None:
        system = (
            "Extract structured sales fields from meeting notes. "
            "Return JSON only: project_description, scoped_budget, scoped_timeline, "
            "meeting_transcript_summary, project_categories (array)."
        )
        return await self.complete_json(system, raw_summary)
