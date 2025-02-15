import axios from "axios";
import {multiPolygon, point} from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

// Define a common interface for POI data
export interface POI {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    type?: string;
}

// Define the structure for Isochrone polygons
export interface Isochrone {
    coordinates: [number, number][][][]; // Array of MultiPolygon coordinates
}

// Fetch POIs from Google Maps
const touristTypes = [
    "tourist_attraction",
    "museum",
    "park",
    "restaurant",
    "cafe",
    "shopping_mall",
    "zoo",
    "amusement_park",
    "aquarium",
    "art_gallery",
    "night_club",
    "casino",
];

export const fetchGooglePOIs = async (latitude: number, longitude: number): Promise<POI[]> => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
    const radius = 49999; // Fetch within 50 km

    const requests = touristTypes.map((type) => {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${apiKey}`;
        return axios.get(url);
    });

    const responses = await Promise.all(requests);

    const pois = responses.flatMap((response) =>
        response.data.results.map((result: any) => ({
            id: result.place_id,
            name: result.name,
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            type: result.types[0],
        }))
    );

    // Remove duplicate POIs by ID
    return Array.from(new Map(pois.map((poi) => [poi.id, poi])).values());
};

// Fetch POIs from OpenStreetMap
export const fetchOSMPOIs = async (latitude: number, longitude: number): Promise<POI[]> => {
    const radius = 70000;
    const amenityFilters = [
        "restaurant",
        "cafe",
        "park",
        "museum",
        "hotel",
        "tourist_attraction",
    ].join("|");

    const tourismFilters = [
        "hotel",
        "museum",
        "attraction",
    ].join("|");

    // Construct the Overpass API query with filtering by amenities and tourism
    const url = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity~"${amenityFilters}"](around:${radius},${latitude},${longitude});node[tourism~"${tourismFilters}"](around:${radius},${latitude},${longitude});out;`;

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
                type: element.tags.amenity || element.tags.tourism,
            }));
    } catch (error) {
        console.error("Error fetching OSM POIs:", error);
        throw error;
    }
};

// Fetch Google POI details
export const fetchGooglePOIDetails = async (poiId: string): Promise<any> => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${poiId}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const result = response.data.result;

        return {
            name: result.name,
            address: result.formatted_address,
            phone: result.formatted_phone_number,
            website: result.website,
            openingHours: result.opening_hours?.weekday_text,
            rating: result.rating,
            reviews: result.reviews?.map((review: any) => review.text),
            type: result.types?.[0],
        };
    } catch (error) {
        console.error("Error fetching Google POI details:", error);
        throw error;
    }
};

// Fetch OSM POI details
export const fetchOSMPOIDetails = async (poiId: string): Promise<any> => {
    const url = `https://overpass-api.de/api/interpreter?data=[out:json];node(${poiId});out;`;

    try {
        const response = await axios.get(url);
        const result = response.data.elements[0];

        return {
            name: result.tags.name,
            address: result.tags["addr:full"],
            phone: result.tags.phone,
            website: result.tags.website,
            openingHours: result.tags.opening_hours,
            rating: null, // OSM does not provide ratings
            reviews: null, // OSM does not provide reviews
            type: result.tags.amenity,
        };
    } catch (error) {
        console.error("Error fetching OSM POI details:", error);

        // Fallback to a different Overpass API endpoint
        const fallbackUrl = `https://lz4.overpass-api.de/api/interpreter?data=[out:json];node(${poiId});out;`;
        try {
            const response = await axios.get(fallbackUrl);
            const result = response.data.elements[0];

            return {
                name: result.tags.name,
                address: result.tags["addr:full"],
                phone: result.tags.phone,
                website: result.tags.website,
                openingHours: result.tags.opening_hours,
                rating: null, // OSM does not provide ratings
                reviews: null, // OSM does not provide reviews
                type: result.tags.amenity,
            };
        } catch (fallbackError) {
            console.error("Error fetching OSM POI details from fallback endpoint:", fallbackError);
            throw fallbackError;
        }
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

export const fetchMapboxRoute = async (
    start: [number, number],
    end: [number, number],
    profile: "driving" | "driving-traffic" | "walking" | "cycling"
): Promise<{ parts: { mode: string; coords: { lat: number; lng: number }[] }[] }> => {
    const apiKey = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${apiKey}`;

    try {
        const response = await axios.get(url);
        const coordinates = response.data.routes[0].geometry.coordinates;

        const parts = [{
            mode: profile,
            coords: coordinates.map(([lng, lat]: [number, number]) => ({
                lat,
                lng,
            })),
        }];

        return { parts };
    } catch (error) {
        console.error("Error fetching Mapbox route:", error);
        throw error;
    }
};

export const fetchTravelTimeRoute = async (
    start: [number, number],
    end: [number, number]
): Promise<{ parts: { mode: string; coords: { lat: number; lng: number }[] }[] }> => {
    const appId = process.env.EXPO_PUBLIC_TRAVELTIME_APP_ID;
    const apiKey = process.env.EXPO_PUBLIC_TRAVELTIME_API_KEY;

    const url = `https://api.traveltimeapp.com/v4/routes`;

    const body = {
        locations: [
            { id: "start", coords: { lat: start[1], lng: start[0] } },
            { id: "end", coords: { lat: end[1], lng: end[0] } },
        ],
        departure_searches: [
            {
                id: "public_transport_route",
                departure_location_id: "start",
                arrival_location_ids: ["end"],
                transportation: { type: "public_transport" },
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

        const parts = response.data.results[0].locations[0].properties[0].route.parts.map((part: any) => ({
            mode: part.mode,
            coords: part.coords.map((coord: { lat: number; lng: number }) => ({
                lat: coord.lat,
                lng: coord.lng,
            })),
        }));

        return { parts };
    } catch (error) {
        console.error("Error fetching TravelTime route:", error);
        throw error;
    }
};
