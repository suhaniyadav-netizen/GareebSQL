from decimal import Decimal
from datetime import date, datetime
from flask import jsonify

def serialize_data(data):
    """
    Recursively serialize MySQL result dictionaries containing
    Decimal, date, and datetime objects into JSON-compatible values.
    """
    if isinstance(data, list):
        return [serialize_data(item) for item in data]
    elif isinstance(data, dict):
        return {key: serialize_data(val) for key, val in data.items()}
    elif isinstance(data, Decimal):
        return float(data)
    elif isinstance(data, (datetime, date)):
        return data.isoformat()
    return data

def success_response(data=None, message="Operation successful", status_code=200):
    response_body = {
        "success": True,
        "message": message,
        "data": serialize_data(data) if data is not None else None
    }
    return jsonify(response_body), status_code

def error_response(message="An error occurred", status_code=400, details=None):
    response_body = {
        "success": False,
        "error": message
    }
    if details is not None:
        response_body["details"] = str(details)
    return jsonify(response_body), status_code
