from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.app.db.session import get_db
from backend.app.models.candidate import CandidateProfile, CandidateSkill
from backend.app.models.skill import Skill
from backend.app.schemas.candidate import CandidateProfileResponse, CandidateProfileUpdate
from backend.app.schemas.skill import CandidateSkillCreate, CandidateSkillResponse, SkillResponse
from backend.app.api.dependencies import get_current_candidate
from backend.app.processing.normalizer import normalize_skill_name, get_skill_category

router = APIRouter(prefix="/candidate", tags=["Candidate"])


@router.get("", response_model=CandidateProfileResponse)
async def get_candidate_profile(
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    # Load skills with skill details
    stmt = (
        select(CandidateProfile)
        .where(CandidateProfile.id == candidate.id)
        .options(selectinload(CandidateProfile.skills).selectinload(CandidateSkill.skill))
    )
    result = await db.execute(stmt)
    cand = result.scalar_one()
    
    skill_responses = []
    for cs in cand.skills:
        skill_responses.append(
            CandidateSkillResponse(
                id=cs.id,
                candidate_id=cs.candidate_id,
                skill_id=cs.skill_id,
                skill_name=cs.skill.name if cs.skill else "Unknown",
                skill_category=cs.skill.category if cs.skill else "General",
                proficiency_level=cs.proficiency_level,
                years_experience=cs.years_experience,
                is_top_skill=cs.is_top_skill,
                notes=cs.notes,
                created_at=cs.created_at,
                updated_at=cs.updated_at
            )
        )
    
    resp = CandidateProfileResponse.model_validate(cand)
    resp.skills = skill_responses
    return resp


@router.patch("", response_model=CandidateProfileResponse)
async def update_candidate_profile(
    update_data: CandidateProfileUpdate,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(candidate, key, value)
    
    await db.commit()
    await db.refresh(candidate)
    return await get_candidate_profile(db=db, candidate=candidate)


@router.get("/skills/taxonomy", response_model=List[SkillResponse])
async def get_all_taxonomy_skills(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Skill).order_by(Skill.category, Skill.name))
    return result.scalars().all()


@router.post("/skills", response_model=CandidateSkillResponse, status_code=status.HTTP_201_CREATED)
async def add_candidate_skill(
    skill_data: CandidateSkillCreate,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    skill = None
    if skill_data.skill_id:
        skill_res = await db.execute(select(Skill).where(Skill.id == skill_data.skill_id))
        skill = skill_res.scalar_one_or_none()

    if not skill and skill_data.skill_name and skill_data.skill_name.strip():
        canonical_name = normalize_skill_name(skill_data.skill_name.strip())
        skill_res = await db.execute(select(Skill).where(Skill.name.ilike(canonical_name)))
        skill = skill_res.scalar_one_or_none()
        if not skill:
            category = skill_data.skill_category or get_skill_category(canonical_name)
            skill = Skill(name=canonical_name, category=category)
            db.add(skill)
            await db.flush()

    if not skill:
        raise HTTPException(status_code=400, detail="Please provide a valid skill name or skill ID")
    
    # Check if already added
    existing_cs = await db.execute(
        select(CandidateSkill).where(
            CandidateSkill.candidate_id == candidate.id,
            CandidateSkill.skill_id == skill.id
        )
    )
    if existing_cs.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Skill '{skill.name}' is already in your profile")
    
    new_cs = CandidateSkill(
        candidate_id=candidate.id,
        skill_id=skill.id,
        proficiency_level=skill_data.proficiency_level,
        years_experience=skill_data.years_experience,
        is_top_skill=skill_data.is_top_skill,
        notes=skill_data.notes
    )
    db.add(new_cs)
    await db.commit()
    await db.refresh(new_cs)
    
    return CandidateSkillResponse(
        id=new_cs.id,
        candidate_id=new_cs.candidate_id,
        skill_id=new_cs.skill_id,
        skill_name=skill.name,
        skill_category=skill.category,
        proficiency_level=new_cs.proficiency_level,
        years_experience=new_cs.years_experience,
        is_top_skill=new_cs.is_top_skill,
        notes=new_cs.notes,
        created_at=new_cs.created_at,
        updated_at=new_cs.updated_at
    )



@router.delete("/skills/{candidate_skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_candidate_skill(
    candidate_skill_id: str,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    result = await db.execute(
        select(CandidateSkill).where(
            CandidateSkill.id == candidate_skill_id,
            CandidateSkill.candidate_id == candidate.id
        )
    )
    cs = result.scalar_one_or_none()
    if not cs:
        raise HTTPException(status_code=404, detail="Candidate skill not found")
    
    await db.delete(cs)
    await db.commit()


@router.post("/resume/upload", response_model=CandidateProfileResponse)
async def upload_and_parse_resume(
    file: UploadFile = File(None),
    raw_text: Optional[str] = Form(None),
    provider: Optional[str] = Form("fallback"),
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    """
    Parses a PDF or plain text resume and automatically populates
    the candidate profile and skill inventory.
    """
    resume_text = ""
    if file:
        file_bytes = await file.read()
        filename = file.filename.lower() if file.filename else ""
        if filename.endswith(".pdf"):
            from backend.app.processing.resume_parser import extract_text_from_pdf_bytes
            success, extracted, err = extract_text_from_pdf_bytes(file_bytes)
            if not success or not extracted:
                raise HTTPException(status_code=400, detail=err or "Could not extract text from PDF")
            resume_text = extracted
        else:
            try:
                resume_text = file_bytes.decode("utf-8")
            except Exception:
                resume_text = file_bytes.decode("latin-1", errors="ignore")
    elif raw_text and raw_text.strip():
        resume_text = raw_text.strip()
    else:
        raise HTTPException(status_code=400, detail="Please upload a PDF/text file or paste your resume content.")

    # 1. Parse resume through AI provider
    from backend.app.ai.factory import get_ai_provider
    ai = get_ai_provider(provider)
    parsed_data = await ai.parse_resume_data(resume_text)

    # 2. Update CandidateProfile fields
    if parsed_data.full_name and parsed_data.full_name != "Candidate":
        candidate.full_name = parsed_data.full_name
    if parsed_data.headline:
        candidate.headline = parsed_data.headline
    if parsed_data.summary:
        candidate.summary = parsed_data.summary
    if parsed_data.target_roles:
        candidate.target_roles = parsed_data.target_roles
    if parsed_data.years_of_experience is not None:
        candidate.years_of_experience = parsed_data.years_of_experience
    if parsed_data.education_level:
        candidate.education_level = parsed_data.education_level
    if parsed_data.github_url:
        candidate.github_url = parsed_data.github_url
    if parsed_data.linkedin_url:
        candidate.linkedin_url = parsed_data.linkedin_url

    await db.commit()

    # 3. Auto-populate Skill inventory
    for s in parsed_data.skills:
        # Check if skill exists in taxonomy
        skill_res = await db.execute(select(Skill).where(Skill.name.ilike(s.name)))
        existing_tax_skill = skill_res.scalar_one_or_none()
        if not existing_tax_skill:
            cat = get_skill_category(s.name)
            existing_tax_skill = Skill(name=s.name, category=cat)
            db.add(existing_tax_skill)
            await db.commit()
            await db.refresh(existing_tax_skill)

        # Check if candidate already has this skill
        cs_res = await db.execute(
            select(CandidateSkill).where(
                CandidateSkill.candidate_id == candidate.id,
                CandidateSkill.skill_id == existing_tax_skill.id
            )
        )
        existing_cs = cs_res.scalar_one_or_none()
        if existing_cs:
            existing_cs.proficiency_level = s.proficiency_level
            existing_cs.years_experience = s.years_experience
            existing_cs.is_top_skill = s.is_top_skill
            existing_cs.skill = existing_tax_skill
        else:
            new_cs = CandidateSkill(
                candidate_id=candidate.id,
                skill_id=existing_tax_skill.id,
                proficiency_level=s.proficiency_level,
                years_experience=s.years_experience,
                is_top_skill=s.is_top_skill
            )
            new_cs.skill = existing_tax_skill
            db.add(new_cs)

    await db.commit()
    return await get_candidate_profile(db=db, candidate=candidate)
