import math
from typing import Tuple

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees), returning distance in kilometers.
    """
    # Earth radius in kilometers
    R = 6371.0

    # Convert decimal degrees to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    distance = R * c
    return round(distance, 2)

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Returns the distance in meters."""
    return haversine_distance_km(lat1, lon1, lat2, lon2) * 1000.0

def is_within_proximity(lat1: float, lon1: float, lat2: float, lon2: float, max_meters: float = 500.0) -> Tuple[bool, float]:
    """
    Returns (True, distance_meters) if distance between (lat1, lon1) and (lat2, lon2) <= max_meters.
    """
    dist_meters = haversine_distance_meters(lat1, lon1, lat2, lon2)
    return dist_meters <= max_meters, round(dist_meters, 1)
