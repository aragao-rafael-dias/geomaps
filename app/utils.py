import math
import os
import requests
from dotenv import load_dotenv

load_dotenv()

def haversine(lat1, lon1, lat2, lon2, R=6371):
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distancia = R * c
    return distancia, c

def temperature(lat, lon):
    API_KEY = os.getenv("API_KEY")
    url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    response = requests.get(url).json()
    return response.get("main", {}).get("temp", "N/A")

def altitude(lat, lon):
    url = f"https://api.open-elevation.com/api/v1/lookup?locations={lat},{lon}"
    try:
        data = requests.get(url).json()
        if "results" in data and len(data["results"]) > 0:
            return data["results"][0]["elevation"]
    except Exception:
        pass
    return "N/A"

def location_name(lat, lon):
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
    headers = {'User-Agent': 'GeomapsApp/1.0'}
    try:
        data = requests.get(url, headers=headers).json()
        return data.get("display_name", "N/A")
    except Exception:
        return "N/A"
    
def get_hemisphere(lat, lon):
    
    if lat > 0 and lon > 0:
        return "Norte, Oriental"
    elif lat > 0 and lon < 0:
        return "Norte, Ocidental"
    elif lat > 0 and lon == 0:
        return "Norte, Greenwich"
    
    if lat < 0 and lon > 0:
        return "Sul, Oriental"
    elif lat < 0 and lon < 0:
        return "Sul, Ocidental"
    elif lat < 0 and lon == 0:
        return "Sul, Greenwich"

    if lat == 0 and lon > 0:
        return "Equador, Oriental"
    elif lat == 0 and lon < 0:
        return "Equador, Ocidental"
    elif lat == 0 and lon == 0:
        return "Equador, Greenwich"
    