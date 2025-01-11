import axios from "axios";

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
    const radius = 5000; // Radius in meters
    const type = "tourist_attraction"; // Specify POI type
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${apiKey}`;
    console.log(url);

    const response = await axios.get(url);
    console.log(response.data);
    return response.data.results.map((result: any) => ({
        id: result.place_id,
        name: result.name,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
    }));
};

// Fetch POIs from OpenStreetMap (OSM)
export const fetchOSMPOIs = async (latitude: number, longitude: number): Promise<POI[]> => {
    const radius = 0.05; // Approximate degree radius (~5 km)
    const url = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity](around:5000,${latitude},${longitude});out;`;

    const response = await axios.get(url);
    return response.data.elements.map((element: any) => ({
        id: element.id,
        name: element.tags.name || "Unnamed POI",
        latitude: element.lat,
        longitude: element.lon,
    }));
};

// Fetch isochrone data from Mapbox
export const fetchMapboxIsochrone = async (latitude: number, longitude: number): Promise<Isochrone> => {
    const apiKey = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;
    const url = `https://api.mapbox.com/isochrone/v1/mapbox/driving/${longitude},${latitude}?contours_minutes=30&polygons=true&access_token=${apiKey}`;

    const response = await axios.get(url);
    console.log(response.data);
    const coordinates = response.data.features[0].geometry.coordinates[0];
    return { coordinates };
};

// Approximate isochrone for Google Maps (simplified)
export const fetchGoogleIsochrone = async (latitude: number, longitude: number): Promise<Isochrone> => {
    // Use Google Directions API to calculate routes for various angles (360 degrees spread)
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
    const radius = 30 * 60; // 30 minutes in seconds
    const steps = 12; // Number of points to generate the isochrone
    const coordinates: [number, number][] = [];

    for (let i = 0; i < steps; i++) {
        const angle = (360 / steps) * i;
        const destinationLat = latitude + 0.2 * Math.cos(angle * (Math.PI / 180));
        const destinationLng = longitude + 0.2 * Math.sin(angle * (Math.PI / 180));

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${latitude},${longitude}&destination=${destinationLat},${destinationLng}&mode=driving&key=${apiKey}`;
        const response = await axios.get(url);
        const route = response.data.routes[0]?.legs[0]?.end_location;
        if (route) {
            coordinates.push([route.lng, route.lat]);
        }
    }

    return { coordinates };
};
