from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Calculation

calc_bp = Blueprint('calculations', __name__)

VALID_OPERATIONS = ['add', 'subtract', 'multiply', 'divide']


def current_user_id():
    identity = get_jwt_identity()
    try:
        return int(identity)
    except (TypeError, ValueError):
        return None

def compute(operation, a, b):
    if operation == 'add':       return a + b
    if operation == 'subtract':  return a - b
    if operation == 'multiply':  return a * b
    if operation == 'divide':
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return a / b

# BROWSE — GET /calculations
@calc_bp.route('/calculations', methods=['GET'])
@jwt_required()
def browse():
    user_id = current_user_id()
    if user_id is None:
        return jsonify({"error": "Invalid token identity"}), 401
    calcs = Calculation.query.filter_by(user_id=user_id).all()
    return jsonify([c.to_dict() for c in calcs]), 200

# READ — GET /calculations/<id>
@calc_bp.route('/calculations/<int:id>', methods=['GET'])
@jwt_required()
def read(id):
    user_id = current_user_id()
    if user_id is None:
        return jsonify({"error": "Invalid token identity"}), 401
    calc = Calculation.query.filter_by(id=id, user_id=user_id).first()
    if not calc:
        return jsonify({"error": "Calculation not found"}), 404
    return jsonify(calc.to_dict()), 200

# ADD — POST /calculations
@calc_bp.route('/calculations', methods=['POST'])
@jwt_required()
def add():
    user_id = current_user_id()
    if user_id is None:
        return jsonify({"error": "Invalid token identity"}), 401
    data = request.get_json()

    operation = data.get('operation')
    operand1  = data.get('operand1')
    operand2  = data.get('operand2')

    if operation not in VALID_OPERATIONS:
        return jsonify({"error": f"Invalid operation. Choose from {VALID_OPERATIONS}"}), 400
    if operand1 is None or operand2 is None:
        return jsonify({"error": "Both operands are required"}), 400
    if not isinstance(operand1, (int, float)) or not isinstance(operand2, (int, float)):
        return jsonify({"error": "Operands must be numbers"}), 400

    try:
        result = compute(operation, operand1, operand2)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    calc = Calculation(operation=operation, operand1=operand1,
                       operand2=operand2, result=result, user_id=user_id)
    db.session.add(calc)
    db.session.commit()
    return jsonify(calc.to_dict()), 201

# EDIT — PUT /calculations/<id>
@calc_bp.route('/calculations/<int:id>', methods=['PUT'])
@jwt_required()
def edit(id):
    user_id = current_user_id()
    if user_id is None:
        return jsonify({"error": "Invalid token identity"}), 401
    calc = Calculation.query.filter_by(id=id, user_id=user_id).first()
    if not calc:
        return jsonify({"error": "Calculation not found"}), 404

    data = request.get_json() or {}
    operation = data.get('operation', calc.operation)
    operand1  = data.get('operand1', calc.operand1)
    operand2  = data.get('operand2', calc.operand2)

    if operation not in VALID_OPERATIONS:
        return jsonify({"error": "Invalid operation"}), 400
    if not isinstance(operand1, (int, float)) or not isinstance(operand2, (int, float)):
        return jsonify({"error": "Operands must be numbers"}), 400

    try:
        result = compute(operation, operand1, operand2)
    except (TypeError, ValueError) as e:
        return jsonify({"error": str(e)}), 400

    calc.operation = operation
    calc.operand1  = operand1
    calc.operand2  = operand2
    calc.result    = result
    db.session.commit()
    return jsonify(calc.to_dict()), 200

# DELETE — DELETE /calculations/<id>
@calc_bp.route('/calculations/<int:id>', methods=['DELETE'])
@jwt_required()
def delete(id):
    user_id = current_user_id()
    if user_id is None:
        return jsonify({"error": "Invalid token identity"}), 401
    calc = Calculation.query.filter_by(id=id, user_id=user_id).first()
    if not calc:
        return jsonify({"error": "Calculation not found"}), 404
    db.session.delete(calc)
    db.session.commit()
    return jsonify({"message": "Calculation deleted"}), 200
