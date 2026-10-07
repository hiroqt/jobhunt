"""
MCP Security and Guardrails Layer for Job Hunt Pipeline.

Provides security controls, prompt injection defenses, tiered permission enforcement,
and qualification threshold gates for MCP tools and AI agents.
"""

from __future__ import annotations

import re
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Union
from pydantic import BaseModel, Field, model_validator


# ============================================================================
# Models & Results
# ============================================================================

class ContentSanitizationResult(BaseModel):
    """Result of untrusted content inspection and sanitization."""
    is_safe: bool = Field(..., description="Whether the content is safe and free of high-risk injection patterns.")
    flagged_patterns: List[str] = Field(default_factory=list, description="List of detected threat descriptions.")
    sanitized_text: str = Field(..., description="Sanitized text with threats neutralized/stripped.")
    risk_score: float = Field(default=0.0, ge=0.0, le=1.0, description="Assessed risk score between 0.0 and 1.0.")

    @property
    def has_threats(self) -> bool:
        """Convenience property indicating whether threats were detected."""
        return not self.is_safe or len(self.flagged_patterns) > 0


class ActionTier(str, Enum):
    """Tiered permissions for MCP actions."""
    READ = "READ"
    MUTATION = "MUTATION"


class ConfirmationResult(BaseModel):
    """Result of tiered permission and confirmation verification."""
    approved: bool = Field(..., description="Whether the action is approved for execution.")
    tier: ActionTier = Field(..., description="The classified action tier (READ or MUTATION).")
    action_name: str = Field(..., description="The name of the action evaluated.")
    requires_confirmation: bool = Field(default=False, description="Whether explicit user confirmation is required.")
    status: str = Field(default="APPROVED", description="Status code: APPROVED or CONFIRMATION_REQUIRED.")
    target_entity: Optional[str] = Field(default=None, description="Target entity identifier or description.")
    proposed_state_transition: Optional[Dict[str, Any]] = Field(default=None, description="Proposed state change.")
    warning_message: Optional[str] = Field(default=None, description="Security/safety warning if confirmation needed.")
    instruction: Optional[str] = Field(default=None, description="Agent instruction on how to prompt user.")
    instructions: Optional[str] = Field(default=None, description="Alias for instruction.")
    simulation: Optional[Dict[str, Any]] = Field(default=None, description="Structured dry-run simulation payload.")

    @model_validator(mode="after")
    def sync_instructions(self) -> ConfirmationResult:
        if self.instruction and not self.instructions:
            self.instructions = self.instruction
        elif self.instructions and not self.instruction:
            self.instruction = self.instructions
        return self


class QualificationCheckResult(BaseModel):
    """Result of candidate qualification threshold validation."""
    passed: bool = Field(..., description="Whether pipeline insertion is permitted.")
    score: float = Field(..., description="Match score assessed for the job.")
    recommendation: str = Field(..., description="Recommendation badge (APPLY, REVIEW, SKIP, etc.).")
    min_score: float = Field(..., description="Minimum qualifying score threshold.")
    is_flagged: bool = Field(..., description="Whether the job was flagged for low score or SKIP badge.")
    override_applied: bool = Field(default=False, description="Whether an explicit override was applied to pass.")
    reason: str = Field(..., description="Explanation of qualification check outcome.")
    details: Dict[str, Any] = Field(default_factory=dict, description="Additional context or breakdown.")


# ============================================================================
# 1. PromptInjectionGuardrail
# ============================================================================

class PromptInjectionGuardrail:
    """
    Inspects untrusted external text (scraped job descriptions, external requirements, web content)
    for indirect prompt injection and malicious payloads, and sanitizes them while preserving
    legitimate job information and requirements.
    """

    # Zero-width & invisible character detection regex
    ZERO_WIDTH_PATTERN = re.compile(r"[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]")

    # Directives to ignore prior instructions
    IGNORE_DIRECTIVES = [
        re.compile(
            r"(?i)\b(?:ignore|disregard|forget|bypass|override)\s+(?:all\s+|any\s+|the\s+)?(?:previous|prior|above|former|initial|system)\s+(?:instructions?|directives?|prompts?|rules?|context|guidelines?)",
            re.IGNORECASE,
        ),
        re.compile(r"(?i)\bsystem\s+prompt\s+override\b", re.IGNORECASE),
        re.compile(r"(?i)\bdisregard\s+prior\s+context\b", re.IGNORECASE),
        re.compile(r"(?i)\bnew\s+(?:system\s+)?instructions?\s*:", re.IGNORECASE),
        re.compile(r"(?i)\boverride\s+(?:the\s+)?system\s+instructions?\b", re.IGNORECASE),
        re.compile(r"(?i)\boverride\s+(?:the\s+)?system\s+prompt\b", re.IGNORECASE),
    ]

    # Role-playing hijack / Jailbreak
    ROLEPLAY_HIJACK = [
        re.compile(
            r"(?i)\byou\s+are\s+now\s+(?:an?\s+)?(?:unrestricted|jailbroken|evil|unaligned|developer)\s+(?:assistant|ai|agent|model|persona|mode)\b",
            re.IGNORECASE,
        ),
        re.compile(r"(?i)\bDAN\s+mode\b", re.IGNORECASE),
        re.compile(r"(?i)\bdeveloper\s+mode\s+(?:active|enabled|on)\b", re.IGNORECASE),
        re.compile(r"(?i)\bjailbreak(?:\s+mode)?\s+(?:active|enabled|on)\b", re.IGNORECASE),
        re.compile(r"(?i)\bact\s+as\s+(?:an?\s+)?(?:unrestricted|jailbroken|evil)\b", re.IGNORECASE),
        re.compile(r"(?i)\bpretend\s+(?:you\s+have\s+)?no\s+(?:rules|filters|safety|restrictions)\b", re.IGNORECASE),
    ]

    # Delimiter injection attacks
    DELIMITER_BLOCKS = [
        # Full XML blocks like <system>...</system>
        re.compile(r"(?i)<(system|instructions?|admin|prompt|assistant|context)>.*?</\1>", re.DOTALL),
        # Markdown fenced blocks with begin/end
        re.compile(
            r"(?i)^[ \t]*---+\s*(?:BEGIN|START)\s+(?:SYSTEM|ADMIN|PROMPT|INSTRUCTIONS?)[^\n]*---+\n.*?\n[ \t]*---+\s*(?:END|FINISH)\s+(?:SYSTEM|ADMIN|PROMPT|INSTRUCTIONS?)[^\n]*---+",
            re.DOTALL | re.MULTILINE,
        ),
        re.compile(
            r"(?i)^[ \t]*===+\s*(?:BEGIN|START)\s+(?:SYSTEM|ADMIN|PROMPT|INSTRUCTIONS?)[^\n]*===+\n.*?\n[ \t]*===+\s*(?:END|FINISH)\s+(?:SYSTEM|ADMIN|PROMPT|INSTRUCTIONS?)[^\n]*===+",
            re.DOTALL | re.MULTILINE,
        ),
    ]

    DELIMITER_TAGS = [
        # XML tags like <system>, <instructions>, <admin>, <prompt>
        re.compile(r"</?(?:system|instructions?|admin|prompt|assistant|context|im_start|im_end)>", re.IGNORECASE),
        re.compile(r"<\|(?:im_start|im_end|system|user|assistant)\|>", re.IGNORECASE),
        # Delimiter lines like --- BEGIN SYSTEM PROMPT ---
        re.compile(r"(?i)^[ \t]*---+\s*(?:BEGIN|START|END)?\s*(?:SYSTEM|ADMIN|PROMPT|INSTRUCTIONS?)[^\n]*---+[ \t]*$", re.MULTILINE),
        re.compile(r"(?i)^[ \t]*===+\s*(?:BEGIN|START|END)?\s*(?:SYSTEM|ADMIN|PROMPT|INSTRUCTIONS?)[^\n]*===+[ \t]*$", re.MULTILINE),
        re.compile(r"(?i)^[ \t]*#{1,6}\s*(?:SYSTEM\s+(?:PROMPT|INSTRUCTION|DIRECTIVE|OVERRIDE))[^\n]*$", re.MULTILINE),
    ]

    # Exfiltration hooks: hidden markdown images or data exfil URLs
    EXFIL_IMAGE_PATTERN = re.compile(r"!\[.*?\]\((https?://[^\s\)]+)\)", re.IGNORECASE)
    SUSPICIOUS_EXFIL_URLS = [
        re.compile(r"https?://[^\s\)\'\"]*(?:exfil|canarytokens?|webhook\.site|pipedream\.net|requestbin|attacker\.com)[^\s\)\'\"]*", re.IGNORECASE),
        re.compile(r"https?://[^\s\)\'\"]*[?&](?:data|leak|token|secret|exfil|stolen)=[^\s\)\'\"]*", re.IGNORECASE),
    ]

    # Command execution payloads
    COMMAND_PAYLOADS = [
        re.compile(r"\brm\s+-(?:rf|fr|r)\b[^\n;]*", re.IGNORECASE),
        re.compile(r"(?:curl|wget)\s+[^\n|;]+?\|\s*(?:ba|z)?sh\b", re.IGNORECASE),
        re.compile(r"\b(?:eval|exec)\s*\([^\)]*\)", re.IGNORECASE),
        re.compile(r"\bpython(?:3)?\s+-c\s+[\'\"][^\'\"]+[\'\"]", re.IGNORECASE),
        re.compile(r"\b(?:bash|sh)\s+-c\s+[\'\"][^\'\"]+[\'\"]", re.IGNORECASE),
        re.compile(r"\bpowershell(?:\.exe)?\s+(?:-enc|-c|-command)\s+[^\n;]+", re.IGNORECASE),
        re.compile(r"\bmkfifo\b[^\n;]*;\s*nc\b", re.IGNORECASE),
    ]

    def __init__(self, risk_threshold: float = 0.5):
        self.risk_threshold = risk_threshold

    def sanitize_untrusted_content(self, text: str) -> ContentSanitizationResult:
        """
        Inspects untrusted external text and neutralizes malicious prompt injection
        blocks while preserving genuine job requirements and qualifications.
        """
        if not text:
            return ContentSanitizationResult(
                is_safe=True,
                flagged_patterns=[],
                sanitized_text="",
                risk_score=0.0,
            )

        flagged: List[str] = []
        severity_scores: List[float] = []
        sanitized = text

        # 1. Zero-width character inspection and neutralization
        if self.ZERO_WIDTH_PATTERN.search(sanitized):
            flagged.append("Zero-width hidden characters detected (evasion / steganography)")
            severity_scores.append(0.50)
            sanitized = self.ZERO_WIDTH_PATTERN.sub("", sanitized)

        # 2. Delimiter injection (XML blocks, markdown fences, system tags)
        for block_pat in self.DELIMITER_BLOCKS:
            if block_pat.search(sanitized):
                flagged.append("Delimiter injection attack: block detected")
                severity_scores.append(0.65)
                sanitized = block_pat.sub("", sanitized)

        for pattern in self.DELIMITER_TAGS:
            if pattern.search(sanitized):
                flagged.append(f"Delimiter injection attack: '{pattern.pattern}' detected")
                severity_scores.append(0.60)
                sanitized = pattern.sub("", sanitized)

        # 3. Directives to ignore prior instructions
        for pattern in self.IGNORE_DIRECTIVES:
            matches = list(pattern.finditer(sanitized))
            if matches:
                flagged.append("Directive to ignore prior instructions / override system prompt")
                severity_scores.append(0.85)
                for match in matches:
                    sanitized = sanitized.replace(match.group(0), "")

        # 4. Role-playing hijack / Jailbreak
        for pattern in self.ROLEPLAY_HIJACK:
            matches = list(pattern.finditer(sanitized))
            if matches:
                flagged.append(f"Role-playing hijack / jailbreak pattern: '{pattern.pattern}'")
                severity_scores.append(0.80)
                for match in matches:
                    sanitized = sanitized.replace(match.group(0), "")

        # 5. Exfiltration hooks (Markdown images and exfiltration URLs)
        for img_match in self.EXFIL_IMAGE_PATTERN.finditer(sanitized):
            full_img_tag = img_match.group(0)
            img_url = img_match.group(1)
            flagged.append(f"Exfiltration hook: markdown image injection ({img_url[:40]}...)")
            severity_scores.append(0.75)
            sanitized = sanitized.replace(full_img_tag, "")

        for exfil_pat in self.SUSPICIOUS_EXFIL_URLS:
            matches = list(exfil_pat.finditer(sanitized))
            if matches:
                flagged.append("Exfiltration hook: suspicious URL / data query param detected")
                severity_scores.append(0.75)
                for m in matches:
                    sanitized = sanitized.replace(m.group(0), "[REDACTED_SUSPICIOUS_URL]")

        # 6. Command execution payloads
        for cmd_pattern in self.COMMAND_PAYLOADS:
            matches = list(cmd_pattern.finditer(sanitized))
            if matches:
                flagged.append(f"Command execution payload: '{cmd_pattern.pattern}'")
                severity_scores.append(0.95)
                for m in matches:
                    sanitized = sanitized.replace(m.group(0), "")

        # Clean up whitespace formatting: remove orphaned empty lines, trim extra inline spaces
        sanitized = re.sub(r"[ \t]+", " ", sanitized)
        sanitized = re.sub(r"\n{3,}", "\n\n", sanitized).strip()

        # Deduplicate flagged patterns preserving order
        unique_flagged = list(dict.fromkeys(flagged))

        if not unique_flagged:
            risk_score = 0.0
            is_safe = True
        else:
            base_risk = max(severity_scores) if severity_scores else 0.5
            extra_risk = 0.05 * (len(unique_flagged) - 1)
            risk_score = min(1.0, round(base_risk + extra_risk, 2))
            is_safe = False

        return ContentSanitizationResult(
            is_safe=is_safe,
            flagged_patterns=unique_flagged,
            sanitized_text=sanitized,
            risk_score=risk_score,
        )

    def is_safe(self, text: str) -> bool:
        """Helper to quickly check if text has no prompt injection."""
        return self.sanitize_untrusted_content(text).is_safe


# ============================================================================
# 2. TieredPermissionGuardrail
# ============================================================================

class TieredPermissionGuardrail:
    """
    Enforces permission tiers for MCP actions:
    - READ tier actions (autonomous read, evaluate, search) can proceed without confirmation.
    - MUTATION tier actions (save, update status, delete) require explicit confirmation
      or return a structured dry-run simulation payload.
    """

    READ_ACTIONS: Set[str] = {
        "search_jobs",
        "get_job",
        "get_job_details",
        "list_jobs",
        "evaluate_job",
        "match_job",
        "get_application",
        "list_applications",
        "get_candidate_profile",
        "read_resume",
        "get_analytics",
        "verify_link",
        "check_eligibility",
        "preview_cover_letter",
    }

    MUTATION_ACTIONS: Set[str] = {
        "save_job",
        "archive_job",
        "delete_job",
        "create_job",
        "update_job",
        "apply_to_job",
        "create_application",
        "update_application_status",
        "update_application",
        "delete_application",
        "delete_data",
        "generate_and_save_cover_letter",
    }

    # Prefixes that denote READ vs MUTATION operations
    READ_PREFIXES = ("get_", "read_", "list_", "search_", "fetch_", "view_", "eval_", "evaluate_", "check_", "preview_")
    MUTATION_PREFIXES = ("save_", "update_", "delete_", "create_", "insert_", "apply_", "archive_", "remove_", "mutate_", "post_", "patch_")

    def __init__(self, custom_tiers: Optional[Dict[str, ActionTier]] = None):
        self._custom_tiers: Dict[str, ActionTier] = custom_tiers or {}

    def classify_action(self, action_name: str) -> ActionTier:
        """Classifies an action into READ or MUTATION tier."""
        action_name_lower = action_name.lower().strip()
        if action_name_lower in self._custom_tiers:
            return self._custom_tiers[action_name_lower]

        if action_name_lower in self.READ_ACTIONS:
            return ActionTier.READ
        if action_name_lower in self.MUTATION_ACTIONS:
            return ActionTier.MUTATION

        if action_name_lower.startswith(self.READ_PREFIXES):
            return ActionTier.READ
        if action_name_lower.startswith(self.MUTATION_PREFIXES):
            return ActionTier.MUTATION

        # Conservative fallback: treat unknown actions as MUTATION to safeguard data
        return ActionTier.MUTATION

    def enforce_confirmation(
        self,
        action_name: str,
        params: Optional[Dict[str, Any]] = None,
        confirm: bool = False,
    ) -> ConfirmationResult:
        """
        Enforces confirmation requirement based on action tier.
        - If tier is READ: approved automatically.
        - If tier is MUTATION and confirm is True: approved.
        - If tier is MUTATION and confirm is False: returns dry-run simulation payload.
        """
        params = params or {}
        tier = self.classify_action(action_name)

        target_entity = self._extract_target_entity(action_name, params)
        proposed_transition = self._build_proposed_state_transition(action_name, params)

        if tier == ActionTier.READ:
            return ConfirmationResult(
                approved=True,
                tier=ActionTier.READ,
                action_name=action_name,
                requires_confirmation=False,
                status="APPROVED",
                target_entity=target_entity,
                proposed_state_transition=None,
                warning_message=None,
                instruction=None,
                simulation=None,
            )

        if confirm:
            return ConfirmationResult(
                approved=True,
                tier=ActionTier.MUTATION,
                action_name=action_name,
                requires_confirmation=False,
                status="APPROVED",
                target_entity=target_entity,
                proposed_state_transition=proposed_transition,
                warning_message=None,
                instruction=f"Action '{action_name}' confirmed and approved for execution.",
                simulation={
                    "action": action_name,
                    "target_entity": target_entity,
                    "proposed_state_transition": proposed_transition,
                    "status": "APPROVED",
                    "confirmed": True,
                },
            )

        # MUTATION with confirm=False: Dry run simulation payload
        warning_msg = (
            f"Action '{action_name}' is a MUTATION that modifies persistent state for target '{target_entity}'. "
            f"User confirmation is required prior to execution."
        )
        instruction_msg = (
            f"Present this proposed change to the user and prompt for confirmation: "
            f"'I am preparing to execute {action_name} for {target_entity}. "
            f"Proposed state transition: {proposed_transition}. "
            f"Do you confirm this action?' Once the user approves, re-invoke '{action_name}' with confirm=True."
        )
        simulation_payload = {
            "dry_run": True,
            "action": action_name,
            "tier": ActionTier.MUTATION.value,
            "target_entity": target_entity,
            "proposed_state_transition": proposed_transition,
            "warning": warning_msg,
            "instruction": instruction_msg,
            "required_parameters_to_commit": {**params, "confirm": True},
        }

        return ConfirmationResult(
            approved=False,
            tier=ActionTier.MUTATION,
            action_name=action_name,
            requires_confirmation=True,
            status="CONFIRMATION_REQUIRED",
            target_entity=target_entity,
            proposed_state_transition=proposed_transition,
            warning_message=warning_msg,
            instruction=instruction_msg,
            simulation=simulation_payload,
        )

    def _extract_target_entity(self, action_name: str, params: Dict[str, Any]) -> str:
        """Identifies target entity from action parameters."""
        for key in ("target_entity", "job_id", "application_id", "candidate_id", "id", "entity_id"):
            if key in params and params[key] is not None:
                val = str(params[key])
                if key == "job_id":
                    return f"job:{val}"
                if key == "application_id":
                    return f"application:{val}"
                return val

        if "url" in params:
            return f"url:{params['url']}"
        if "title" in params:
            company = params.get("company", "")
            return f"{params['title']} @ {company}" if company else str(params["title"])

        return "unspecified_entity"

    def _build_proposed_state_transition(self, action_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Builds structured representation of the proposed state transition."""
        action_lower = action_name.lower()
        if "update_application_status" in action_lower:
            return {
                "entity_type": "application",
                "entity_id": params.get("application_id", params.get("id")),
                "field": "status",
                "current_state": params.get("current_status", "UNKNOWN"),
                "proposed_state": params.get("status") or params.get("new_status"),
                "notes": params.get("notes"),
            }
        if "delete" in action_lower:
            return {
                "operation": "DELETE",
                "target_entity": self._extract_target_entity(action_name, params),
                "proposed_state": "DELETED",
            }
        if "save" in action_lower or "archive" in action_lower:
            return {
                "operation": action_name.upper(),
                "target_entity": self._extract_target_entity(action_name, params),
                "proposed_state": "SAVED" if "save" in action_lower else "ARCHIVED",
                "payload": {k: v for k, v in params.items() if k != "confirm"},
            }

        return {
            "operation": action_name,
            "params": {k: v for k, v in params.items() if k != "confirm"},
        }


# ============================================================================
# 3. QualificationThresholdGuardrail
# ============================================================================

class QualificationThresholdGuardrail:
    """
    Validates whether a job meets minimum qualification threshold before pipeline insertion.
    Flags low-score or SKIP-badged recommendations unless an explicit override flag is provided.
    """

    SKIP_BADGES: Set[str] = {
        "SKIP",
        "REJECT",
        "UNQUALIFIED",
        "NOT_RECOMMENDED",
        "DO_NOT_APPLY",
        "DISQUALIFIED",
    }

    def __init__(self, default_min_score: float = 60.0):
        self.default_min_score = float(default_min_score)

    def validate_qualification(
        self,
        job: Union[Dict[str, Any], Any, None] = None,
        *,
        score: Optional[Union[float, int]] = None,
        recommendation: Optional[str] = None,
        override: bool = False,
        min_score: Optional[float] = None,
    ) -> QualificationCheckResult:
        """
        Validates job qualification criteria before pipeline insertion.
        Flags low scores (< min_score) or SKIP-badged recommendations.
        Permits insertion if criteria are met OR if explicit override is provided.
        """
        effective_min_score = float(min_score) if min_score is not None else self.default_min_score

        # Extract score and recommendation from job if provided
        extracted_score = None
        extracted_rec = None
        eligibility_status = None

        if isinstance(job, dict):
            for key in ("overall_score", "match_score", "score", "qualification_score"):
                if key in job and job[key] is not None:
                    try:
                        extracted_score = float(job[key])
                        break
                    except (ValueError, TypeError):
                        pass
            for key in ("recommendation", "badge", "qualification_badge"):
                if key in job and job[key] is not None:
                    extracted_rec = str(job[key])
                    break
            eligibility_status = job.get("eligibility_status")
        elif job is not None:
            # Handle Pydantic models or objects
            for attr in ("overall_score", "match_score", "score"):
                if hasattr(job, attr) and getattr(job, attr) is not None:
                    try:
                        extracted_score = float(getattr(job, attr))
                        break
                    except (ValueError, TypeError):
                        pass
            for attr in ("recommendation", "badge"):
                if hasattr(job, attr) and getattr(job, attr) is not None:
                    extracted_rec = str(getattr(job, attr))
                    break
            eligibility_status = getattr(job, "eligibility_status", None)

        # Explicit kwargs override extracted attributes
        final_score = float(score) if score is not None else (extracted_score if extracted_score is not None else 0.0)
        final_rec = (recommendation or extracted_rec or "UNKNOWN").strip().upper()

        # Check conditions
        is_low_score = final_score < effective_min_score
        is_skip_badge = final_rec in self.SKIP_BADGES
        is_failed_critical = eligibility_status == "FAILED_CRITICAL_CONSTRAINT"

        issues = []
        if is_low_score:
            issues.append(f"Score {final_score:.1f} is below minimum threshold ({effective_min_score:.1f})")
        if is_skip_badge:
            issues.append(f"Recommendation badge is '{final_rec}'")
        if is_failed_critical:
            issues.append("Eligibility check failed critical constraint")

        is_flagged = len(issues) > 0

        details = {
            "score": final_score,
            "recommendation": final_rec,
            "min_score": effective_min_score,
            "is_low_score": is_low_score,
            "is_skip_badge": is_skip_badge,
            "is_failed_critical": is_failed_critical,
            "issues": issues,
            "override_provided": override,
        }

        if not is_flagged:
            # Meets qualification threshold
            return QualificationCheckResult(
                passed=True,
                score=final_score,
                recommendation=final_rec,
                min_score=effective_min_score,
                is_flagged=False,
                override_applied=False,
                reason=f"Job meets qualification threshold (score: {final_score:.1f} >= {effective_min_score:.1f}, recommendation: '{final_rec}').",
                details=details,
            )

        # Flagged condition
        issues_summary = "; ".join(issues)
        if override:
            return QualificationCheckResult(
                passed=True,
                score=final_score,
                recommendation=final_rec,
                min_score=effective_min_score,
                is_flagged=True,
                override_applied=True,
                reason=f"Job flagged ({issues_summary}), but pipeline insertion permitted via explicit override.",
                details=details,
            )
        else:
            return QualificationCheckResult(
                passed=False,
                score=final_score,
                recommendation=final_rec,
                min_score=effective_min_score,
                is_flagged=True,
                override_applied=False,
                reason=f"Job rejected from pipeline insertion: {issues_summary}. Explicit override required.",
                details=details,
            )

    def is_qualified(self, score: float, recommendation: str, min_score: Optional[float] = None) -> bool:
        """Helper to quickly check if a score and recommendation qualify without override."""
        result = self.validate_qualification(score=score, recommendation=recommendation, min_score=min_score)
        return result.passed and not result.is_flagged
