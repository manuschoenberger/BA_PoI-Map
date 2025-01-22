import axios from "axios";
import { point, polygon, multiPolygon } from "@turf/helpers";
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
    coordinates: [number, number][][][]; // Array of MultiPolygon coordinates
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
    const radius = 70000; // Approximate radius of 50 km
    // Filter for specific amenities to reduce the number of results

    // const amenityFilters = ["restaurant","cafe","park","museum","hotel","tourist_attraction",].join("|");
    const amenityFilters = [
        "park",
        "museum",
        "hotel",
        "tourist_attraction",
    ].join("|");

    // Construct the Overpass API query with filtering by amenities
    const url = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity~"${amenityFilters}"](around:${radius},${latitude},${longitude});out;`;

    try {
        const response = await axios.get(url);

        // Filter and map the response
        return response.data.elements
            .filter((element: any) => element.tags.name) // Include only named POIs
            .map((element: any) => ({
                id: element.id,
                name: element.tags.name,
                latitude: element.lat,
                longitude: element.lon,
            }));
    } catch (error) {
        console.error("Error fetching OSM POIs:", error);
        throw error;
    }
};

// Filter POIs within Isochrone
export const filterPOIsWithinIsochrone = (pois: POI[], isochrone: Isochrone): POI[] => {
    const isoMultiPolygon = multiPolygon(isochrone.coordinates);
    return pois.filter((poi) => {
        const poiPoint = point([poi.longitude, poi.latitude]);
        return booleanPointInPolygon(poiPoint, isoMultiPolygon);
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
    const coordinates = response.data.features.map((feature: any) => feature.geometry.coordinates);
    return { coordinates };
};

// Fetch isochrone data from TravelTime API with multiple shells and holes
export const fetchTravelTimeIsochrone = async (
    latitude: number,
    longitude: number,
    travelTime: number
): Promise<Isochrone> => {
    const appId = process.env.EXPO_PUBLIC_TRAVELTIME_APP_ID;
    const apiKey = process.env.EXPO_PUBLIC_TRAVELTIME_API_KEY;

    const url = `https://api.traveltimeapp.com/v4/time-map`;

    console.log("fetchTravelTimeIsochrone", latitude, longitude, travelTime * 60);

    const body = {
        departure_searches: [
            {
                id: "public_transport_isochrone",
                coords: { lat: latitude, lng: longitude },
                transportation: { type: "public_transport" },
                travel_time: travelTime * 60, // Convert minutes to seconds
                departure_time: new Date().toISOString(),
            },
        ],
    };

    const headers = {
        "Content-Type": "application/json",
        "X-Application-Id": appId,
        "X-Api-Key": apiKey,
    };

    try {
        const response = await axios.post(url, body, { headers });

        const shapes = response.data.results[0].shapes;

        // Convert all shells and holes into GeoJSON-compatible MultiPolygon coordinates
        const coordinates = shapes.map((shape: any) => {
            const shell = shape.shell.map((point: { lat: number; lng: number }) => [point.lng, point.lat]);

            // Holes may be empty, ensure holes are formatted correctly
            const holes = shape.holes.map((hole: { lat: number; lng: number }[]) =>
                hole.map((point) => [point.lng, point.lat])
            );

            return [shell, ...holes];
        });

        return { coordinates }; // MultiPolygon format for Mapbox compatibility
    } catch (error) {
        console.error("Error fetching TravelTime isochrone:", error);
        throw error;
    }
};
