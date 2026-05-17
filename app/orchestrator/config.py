"""Orchestrator configuration from environment."""

import os
from dataclasses import dataclass, field


@dataclass(frozen=True)
class OrchestratorSettings:
    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""

    # Supervity Auto
    workflow_svc_url: str = ""
    supervity_token: str = ""
    supervity_execute_path: str = "/api/v1/workflow-runs/execute/stream"
    supervity_source_header: str = "v1"
    supervity_active_org: str = ""
    supervity_active_team: str = ""

    workflow_jack: str = ""
    workflow_jim: str = ""
    workflow_jennie: str = ""
    workflow_jason: str = ""
    workflow_gap: str = ""
    # Consolidated agents (fallback to legacy jack/jim/jennie/jason IDs)
    workflow_crm: str = ""
    workflow_email: str = ""
    workflow_legal: str = ""
    workflow_payment: str = ""
    workflow_rag: str = ""
    workflow_check: str = ""  # Agent E — on-demand monitor (OCR + Outlook)
    # OCR is handled by Jason — no separate workflow
    supervity_mock_mode: bool = False

    # LLM (Groq OpenAI-compatible)
    llm_api_url: str = "https://api.groq.com/openai/v1"
    llm_api_key: str = ""
    llm_model: str = "llama-3.1-8b-instant"
    llm_enabled: bool = False

    # Webhook security
    webhook_secret: str = ""
    # true = John writes leads via local Supabase (reliable); set false to call Auto Agent A first
    crm_local_first: bool = True

    # Execution
    supervity_poll_seconds: float = 2.0
    supervity_poll_max_attempts: int = 60

    @classmethod
    def from_env(cls) -> "OrchestratorSettings":
        return cls(
            supabase_url=os.getenv("SUPABASE_URL", "").rstrip("/"),
            supabase_key=os.getenv(
                "SUPABASE_SERVICE_ROLE_KEY",
                os.getenv("SUPABASE_ANON_KEY", os.getenv("SUPABASE_KEY", "")),
            ),
            workflow_svc_url=os.getenv("WORKFLOW_SVC_URL", "").rstrip("/"),
            supervity_token=_clean_bearer_token(os.getenv("SUPERVITY_API_TOKEN", "")),
            supervity_execute_path=os.getenv(
                "SUPERVITY_EXECUTE_PATH",
                "/api/v1/workflow-runs/execute/stream",
            ),
            supervity_source_header=os.getenv("SUPERVITY_SOURCE_HEADER", "v1"),
            supervity_active_org=os.getenv(
                "SUPERVITY_ACTIVE_ORG", "AceLink Software Solutions Pvt LTD"
            ),
            supervity_active_team=os.getenv("SUPERVITY_ACTIVE_TEAM", ""),
            workflow_jack=os.getenv("SUPERVITY_WORKFLOW_JACK", ""),
            workflow_jim=os.getenv("SUPERVITY_WORKFLOW_JIM", ""),
            workflow_jennie=os.getenv("SUPERVITY_WORKFLOW_JENNIE", ""),
            workflow_jason=os.getenv("SUPERVITY_WORKFLOW_JASON", ""),
            workflow_gap=os.getenv("SUPERVITY_WORKFLOW_GAP", ""),
            workflow_crm=os.getenv("SUPERVITY_WORKFLOW_CRM", ""),
            workflow_email=os.getenv("SUPERVITY_WORKFLOW_EMAIL", ""),
            workflow_legal=os.getenv("SUPERVITY_WORKFLOW_LEGAL", ""),
            workflow_payment=os.getenv("SUPERVITY_WORKFLOW_PAYMENT", ""),
            workflow_rag=os.getenv("SUPERVITY_WORKFLOW_RAG", ""),
            workflow_check=os.getenv("SUPERVITY_WORKFLOW_CHECK", ""),
            supervity_mock_mode=_resolve_mock_mode(
                os.getenv("SUPERVITY_MOCK_MODE"),
                os.getenv("WORKFLOW_SVC_URL", ""),
                os.getenv("SUPERVITY_API_TOKEN", ""),
            ),
            llm_api_url=os.getenv("LLM_API_URL", "https://api.groq.com/openai/v1").rstrip("/"),
            llm_api_key=os.getenv("LLM_API_KEY", ""),
            llm_model=os.getenv("LLM_MODEL", "llama-3.1-8b-instant"),
            llm_enabled=os.getenv("LLM_ENABLED", "false").lower() == "true",
            webhook_secret=os.getenv("ORCHESTRATOR_WEBHOOK_SECRET", ""),
            crm_local_first=os.getenv("ORCHESTRATOR_CRM_LOCAL_FIRST", "true").lower()
            == "true",
            supervity_poll_seconds=float(os.getenv("SUPERVITY_POLL_SECONDS", "2")),
            supervity_poll_max_attempts=int(os.getenv("SUPERVITY_POLL_MAX_ATTEMPTS", "60")),
        )

    def configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_key and "supabase.co" in self.supabase_url)

    def supervity_configured(self) -> bool:
        if self.supervity_mock_mode:
            return False
        return bool(self.workflow_svc_url and self.supervity_token)

    def normalize_supabase_url(self) -> str:
        """Fix dashboard URLs pasted by mistake."""
        url = self.supabase_url
        if "dashboard/project/" in url:
            ref = url.rstrip("/").split("/")[-1]
            return f"https://{ref}.supabase.co"
        if not url.startswith("http"):
            return f"https://{url}.supabase.co"
        return url


_settings: OrchestratorSettings | None = None


def _clean_bearer_token(token: str) -> str:
    token = token.strip()
    if token.lower().startswith("bearer "):
        return token[7:].strip()
    return token


def _resolve_mock_mode(env_val: str | None, url: str, token: str) -> bool:
    if env_val is not None:
        return env_val.lower() == "true"
    return not (url.strip() and token.strip())


def get_settings(*, reload: bool = False) -> OrchestratorSettings:
    global _settings
    if _settings is None or reload:
        _settings = OrchestratorSettings.from_env()
    return _settings


def reset_settings_cache() -> None:
    """Clear cached settings (e.g. after load_dotenv in tests)."""
    global _settings
    _settings = None
