from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from models import db
from routes.calculations import calc_bp

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///calculations.db'
    app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    CORS(app)
    db.init_app(app)
    JWTManager(app)

    app.register_blueprint(calc_bp, url_prefix='/api')

    @app.route('/', methods=['GET'])
    def home():
        return jsonify({
            "message": "Calculations backend is running",
            "health": "/api/health"
        }), 200

    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({"status": "ok"}), 200

    # Auth routes (register/login)
    from flask_jwt_extended import create_access_token
    from models import User
    from werkzeug.security import generate_password_hash, check_password_hash

    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.get_json()
        if User.query.filter_by(username=data['username']).first():
            return jsonify({"error": "User already exists"}), 400
        user = User(username=data['username'],
                    password=generate_password_hash(data['password']))
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "User created"}), 201

    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()
        if not user or not check_password_hash(user.password, data['password']):
            return jsonify({"error": "Invalid credentials"}), 401
        # JWT subject ("sub") should be a string for compatibility.
        token = create_access_token(identity=str(user.id))
        return jsonify({"access_token": token}), 200

    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
