from flask_jwt_extended import current_user, jwt_required

from app.api import api
from app.auth import parse_body
from app.extensions import db
from app.models import Profile
from app.schemas import ProfileSchema, UserSchema


def _serialize(user) -> dict:
    return {"user": UserSchema().dump(user), "profile": ProfileSchema().dump(user.profile) if user.profile else None}


@api.get("/profile")
@jwt_required()
def get_profile():
    return _serialize(current_user)


@api.put("/profile")
@jwt_required()
def update_profile():
    data = parse_body(ProfileSchema(), partial=True)
    profile = current_user.profile
    if profile is None:
        profile = Profile(user=current_user)
        db.session.add(profile)
    for field, value in data.items():
        setattr(profile, field, value)
    db.session.commit()
    return _serialize(current_user)
