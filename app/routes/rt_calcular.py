from flask import Flask, render_template, request, jsonify, Blueprint
import math
import requests
from app.utils import haversine, temperature, location_name, altitude, get_hemisphere

bp = Blueprint('rt_calcular', __name__)

@bp.route("/calcular", methods=["POST"])
def calcular():
    data = request.json
    lat1, lon1 = data["ponto1"]
    lat2, lon2 = data["ponto2"]

    distancia_km, angulo_radianos = haversine(lat1, lon1, lat2, lon2)
    angulo_graus = math.degrees(angulo_radianos)

    temp1 = temperature(lat1, lon1)
    alt1 = altitude(lat1, lon1)
    loc1 = location_name(lat1, lon1)
    hemisphere1 = get_hemisphere(lat1, lon1)

    temp2 = temperature(lat2, lon2)
    alt2 = altitude(lat2, lon2)
    loc2 = location_name(lat2, lon2)
    hemisphere2 = get_hemisphere(lat2, lon2)



    return jsonify({
        "distancia_km": distancia_km,
        "angulo_curvatura": angulo_graus,
        "ponto1": {
            "latitude": lat1,
            "longitude": lon1,
            "temperatura": temp1,
            "altitude": alt1,
            "local": loc1,
            "hemisferio": hemisphere1
        },
        "ponto2": {
            "latitude": lat2,
            "longitude": lon2,
            "temperatura": temp2,
            "altitude": alt2,
            "local": loc2,
            "hemisferio": hemisphere2
        }
    })

@bp.route("/details", methods=["GET"])
def details():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except (TypeError, ValueError):
        return jsonify({"error": "Parâmetros inválidos"}), 400
    
    temp = temperature(lat, lon)
    alt = altitude(lat, lon)
    loc = location_name(lat, lon)
    hemisphere = get_hemisphere(lat, lon)
    
    return jsonify({
        "latitude": lat,
        "longitude": lon,
        "temperatura": temp,
        "altitude": alt,
        "local": loc,
        "hemisferio": hemisphere
    })