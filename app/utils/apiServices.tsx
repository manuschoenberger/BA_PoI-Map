import axios from "axios";

// Define a common interface for POI data
export interface POI {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
}

// Fetch POIs from Google Maps
export const fetchGooglePOIs = async (latitude: number, longitude: number): Promise<POI[]> => {
    const apiKey = process.env.GOOGLE_API_KEY;
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
