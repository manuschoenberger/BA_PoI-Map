import axios from "axios";
import {GOOGLE_API_KEY, MAPBOX_API_KEY} from "@env";


// Define a common interface for POI data
export interface POI {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
}

// Fetch POIs from Google Maps
export const fetchGooglePOIs = async (latitude: number, longitude: number): Promise<POI[]> => {
    const apiKey = GOOGLE_API_KEY; // Secure Google API key
    const radius = 5000; // Radius in meters
    const type = "tourist_attraction"; // Specify POI type
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${apiKey}`;

    const response = await axios.get(url);
    console.log(response.data);
    return response.data.results.map((result: any) => ({
        id: result.place_id,
        name: result.name,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
    }));
};

// Fetch POIs from Mapbox
export const fetchMapboxPOIs = async (latitude: number, longitude: number): Promise<POI[]> => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/tourist%20attraction.json?proximity=${longitude},${latitude}&access_token=${MAPBOX_API_KEY}&types=poi`;

    const response = await axios.get(url);
    console.log(response.data);
    return response.data.features.map((feature: any) => ({
        id: feature.id,
        name: feature.text,
        latitude: feature.center[1],
        longitude: feature.center[0],
    }));
};

// Fetch POIs from OpenStreetMap (OSM)
export const fetchOSMPOIs = async (latitude: number, longitude: number): Promise<POI[]> => {
    const radius = 0.05; // Approximate degree radius (~5 km)
    const url = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity](around:5000,${latitude},${longitude});out;`;

    const response = await axios.get(url);
    console.log(response.data);
    return response.data.elements.map((element: any) => ({
        id: element.id,
        name: element.tags.name || "Unnamed POI",
        latitude: element.lat,
        longitude: element.lon,
    }));
};
