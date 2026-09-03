from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, update, delete

from backend.app.db.session import get_db
from backend.app.models.notification import Notification
from backend.app.models.candidate import CandidateProfile
from backend.app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    NotificationUpdate
)
from backend.app.api.dependencies import get_current_candidate

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    # Total notifications
    stmt = (
        select(Notification)
        .where(Notification.candidate_id == candidate.id)
        .order_by(desc(Notification.created_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    notifications = result.scalars().all()

    # Unread count
    unread_res = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.candidate_id == candidate.id,
            Notification.read == False
        )
    )
    unread_count = unread_res.scalar_one() or 0

    return NotificationListResponse(
        notifications=[NotificationResponse.model_validate(n) for n in notifications],
        unread_count=unread_count,
        total_count=len(notifications)
    )


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: str,
    update_data: NotificationUpdate = NotificationUpdate(read=True),
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    stmt = select(Notification).where(
        Notification.id == notification_id,
        Notification.candidate_id == candidate.id
    )
    res = await db.execute(stmt)
    notif = res.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.read = update_data.read if update_data.read is not None else True
    await db.commit()
    await db.refresh(notif)
    return notif


@router.post("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    await db.execute(
        update(Notification)
        .where(Notification.candidate_id == candidate.id, Notification.read == False)
        .values(read=True)
    )
    await db.commit()
    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    candidate: CandidateProfile = Depends(get_current_candidate)
):
    res = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.candidate_id == candidate.id
        )
    )
    notif = res.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    await db.delete(notif)
    await db.commit()
