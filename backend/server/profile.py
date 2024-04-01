from server import app, db
from flask import request, make_response, jsonify
from server.models import Profile
from server.schemas import ProfileSchema

@app.route("/profile", methods = ["GET", "POST"])
def profile_data():
    if request.method == "GET":
        profile_list = Profile.query.all()
        profile = ProfileSchema(many = True).dump(profile_list)  
        return make_response(jsonify(profile), 200)
    
    if request.method == "POST":
        data = request.get_json()
        name = data["name"]
        if Profile.query.filter_by(name = name).first():
            return make_response(jsonify(detail = "Profile exists"))
        else:
            profile = ProfileSchema().load(data)
            new_profile = Profile(**profile)
            db.session.add(new_profile)
            db.session.commit()
            profile_schema = ProfileSchema().dump(new_profile)
            return make_response(jsonify(profile_schema))
        
@app.route("/profile/<int:id>", methods = ["GET", "PATCH", "DELETE"])
def profile_by_id(id):
    if request.method == "GET":
        profile_name = Profile.query.filter_by(id = id).first()
        profile_data = ProfileSchema().dump(profile_name)
        return make_response(jsonify(profile_data), 200)
    
    if request.method == "DELETE":
        profile_item = Profile.query.filter_by(id = id).first()
        db.session.delete(profile_item)
        db.session.commit()
        return make_response(jsonify(message = "Profile deleted successfully"), 200)
    
    if request.method == "PATCH":
        profile = Profile.query.filter_by(id = id).first()
        data = request.get_json()
        profiles = ProfileSchema().load(data)
        for field, value in profiles.items():
            setattr(profile, field, value)
        db.session.add(profile)
        db.session.commit() 

        profile_data = ProfileSchema().dump(profile)
        return make_response(jsonify(profile_data))