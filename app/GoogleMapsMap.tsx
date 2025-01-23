import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Polygon, Marker } from "react-native-maps";
import { LocationObjectCoords } from "expo-location";
import { POI, Isochrone } from "./utils/apiServices";

interface MapProps {
    location: LocationObjectCoords;
    pois: POI[];
    isochrone: Isochrone;
    maxRadius: number;
}

export default function GoogleMapsMap({ location, pois, isochrone, maxRadius }: MapProps) {
    // Calculate the out-of-bounds area
    const outOfBoundsPolygons = isochrone.coordinates.map((polygon) => {
        if (!polygon || !Array.isArray(polygon[0])) return null;
        const outOfBounds = polygon[0].filter(([lng, lat]) => {
            const distance = getDistanceFromLatLonInKm(location.latitude, location.longitude, lat, lng);
            return distance > maxRadius / 1000; // Convert radius to km
        });
        return outOfBounds.length > 0 ? [outOfBounds] : null;
    }).filter(Boolean);

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                showsUserLocation={true}
                userLocationUpdateInterval={30000}
            >
                {pois.map((poi) => (
                    <Marker
                        key={poi.id}
                        coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
                        title={poi.name}
                    />
                ))}
                {isochrone.coordinates.map((polygon, index) => (
                    <Polygon
                        key={index}
                        coordinates={polygon[0].map(([lng, lat]) => ({ latitude: lat, longitude: lng }))}
                        holes={polygon.slice(1).map((hole) =>
                            hole.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))
                        )}
                        fillColor="rgba(0, 150, 255, 0.3)"
                        strokeColor="rgba(0, 150, 255, 0.8)"
                        strokeWidth={2}
                    />
                ))}
                {outOfBoundsPolygons.map((polygon, index) => (
                    <Polygon
                        key={`outOfBounds-${index}`}
                        coordinates={polygon[0].map(([lng, lat]) => ({ latitude: lat, longitude: lng }))}
                        fillColor="rgba(255, 0, 0, 0.3)"
                        strokeColor="rgba(255, 0, 0, 0.8)"
                        strokeWidth={2}
                    />
                ))}
            </MapView>
        </View>
    );
}

// Helper function to calculate distance between two coordinates in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    map: {
        width: "100%",
        height: "100%",
    },
});
