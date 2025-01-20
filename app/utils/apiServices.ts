import axios from "axios";
import { point, polygon } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

// Define a common interface for POI data
export interface POI {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
}

// Define the structure for Isochrone polygons
export interface Isochrone {
    coordinates: [number, number][]; // Array of [longitude, latitude] coordinates
}

// Fetch POIs from Google Maps
export const fetchGooglePOIs = async (latitude: number, longitude: number): Promise<POI[]> => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
    const radius = 49999; // Fetch within 50 km
    const type = "tourist_attraction";
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${apiKey}`;

    const response = await axios.get(url);
    return response.data.results.map((result: any) => ({
        id: result.place_id,
        name: result.name,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
    }));
};

// Fetch POIs from OpenStreetMap
export const fetchOSMPOIs = async (latitude: number, longitude: number): Promise<POI[]> => {
    const radius = 15000; // Approximate degree radius (~15 km)
    const url = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity](around:${radius},${latitude},${longitude});out;`;

    const response = await axios.get(url);

    // Filter out unnamed POIs
    return response.data.elements
        .filter((element: any) => element.tags.name)
        .map((element: any) => ({
            id: element.id,
            name: element.tags.name,
            latitude: element.lat,
            longitude: element.lon,
        }));
};

// Filter POIs within Isochrone
export const filterPOIsWithinIsochrone = (pois: POI[], isochrone: Isochrone): POI[] => {
    const isoPolygon = polygon([isochrone.coordinates]);
    return pois.filter((poi) => {
        const poiPoint = point([poi.longitude, poi.latitude]);
        return booleanPointInPolygon(poiPoint, isoPolygon);
    });
};

// Fetch isochrone data from Mapbox with dynamic contours_minutes and profile
export const fetchMapboxIsochrone = async (
    latitude: number,
    longitude: number,
    contoursMinutes: number,
    profile: "driving" | "driving-traffic" | "walking" | "cycling"
): Promise<Isochrone> => {
    const apiKey = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;
    const url = `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${longitude},${latitude}?contours_minutes=${contoursMinutes}&polygons=true&access_token=${apiKey}`;

    const response = await axios.get(url);
    const coordinates = response.data.features[0].geometry.coordinates[0];
    return { coordinates };
};

// TODO: later include departure_searches.transportation.walking_time and departure_searches.transportation.max_changes
export const fetchTravelTimeIsochrone = async (
    latitude: number,
    longitude: number,
    travelTime: number
): Promise<Isochrone> => {
    const appId = process.env.EXPO_PUBLIC_TRAVELTIME_APP_ID;
    const apiKey = process.env.EXPO_PUBLIC_TRAVELTIME_API_KEY;

    const url = `https://api.traveltimeapp.com/v4/time-map`;

    const body = {
        departure_searches: [
            {
                id: "public_transport_isochrone",
                coords: { lat: latitude, lng: longitude },
                transportation: { type: "public_transport" },
                travel_time: travelTime * 60, // Convert minutes to seconds
                departure_time: new Date().toISOString(),
            }
        ]
    };

    const headers = {
        "Content-Type": "application/json",
        "X-Application-Id": appId,
        "X-Api-Key": apiKey,
    };

    try {
        const response = await axios.post(url, body, { headers });
        const shell = response.data.results[0].shapes[0].shell;

        // Convert TravelTime shell to GeoJSON format
        const coordinates = shell.map((point: { lat: number; lng: number }) => [point.lng, point.lat]);
        // Ensure the polygon is closed by repeating the first point
        coordinates.push(coordinates[0]);

        return { coordinates };
    } catch (error) {
        console.error("Error fetching TravelTime isochrone:", error);
        throw error;
    }
};
