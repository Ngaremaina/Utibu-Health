from server import app, bcrypt, db
from server.models import Users
from server.schemas import UsersSchema
from flask import make_response, request, jsonify
from flask_jwt_extended import create_access_token

@app.route('/users', methods = ['GET'])
def get_users():
    user_list = Users.query.all()
    users = UsersSchema(many=True).dump(user_list)
    return make_response(jsonify(users), 200)

@app.route('/users/<int:id>', methods = ["GET"])
def get_user_by_id(id):
    user_data = Users.query.filter_by(id = id).first()
    user = UsersSchema().dump(user_data)
    return make_response(jsonify(user), 200)

@app.route('/register', methods = ["POST"])
def register_user():
    email = request.json['email']
    password = request.json['password']
    username = request.json['username']

    user_exists = Users.query.filter_by(email = email).first()

    if user_exists:
        return jsonify(message  = 'User exists')
    
    hashed_password = bcrypt.generate_password_hash(password)

    new_user = Users(username = username, password = hashed_password, email = email)

    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "id":new_user.id,
        "email":new_user.email
    })
    
@app.route('/login', methods = ['POST'])
def login_user():
    email = request.json['email']
    password = request.json['password']

    user = Users.query.filter_by(email = email).first()

    if user is None:
        return jsonify(message = "Unauthorized")
    if not bcrypt.check_password_hash(user.password, password):
        return jsonify(message = "Incorrect email/password")
    
    access_token = create_access_token(identity=email)

    user_data = UsersSchema().dump(user)
    
    return jsonify({
        "access_token":access_token,
        "id":user.id,
        "user_data":user_data
    })
