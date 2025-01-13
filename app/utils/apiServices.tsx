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
    const radius = 0.1; // Approximate degree radius (~10 km) //TODO: Later change to 50km
    const url = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity](around:10000,${latitude},${longitude});out;`;

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

// Fetch isochrone data from Mapbox
export const fetchMapboxIsochrone = async (latitude: number, longitude: number): Promise<Isochrone> => {
    const apiKey = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;
    const url = `https://api.mapbox.com/isochrone/v1/mapbox/driving/${longitude},${latitude}?contours_minutes=10&polygons=true&access_token=${apiKey}`;

    const response = await axios.get(url);
    const coordinates = response.data.features[0].geometry.coordinates[0];
    return { coordinates };
};
