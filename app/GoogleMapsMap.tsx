import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Polygon, Marker, Circle, Polyline } from "react-native-maps";
import { LocationObjectCoords } from "expo-location";
import { POI, Isochrone } from "./utils/apiServices";
import { getDistanceFromLatLonInKm } from "./utils/distanceUtils";

interface MapProps {
    location: LocationObjectCoords;
    pois: POI[];
    isochrone: Isochrone;
    maxRadius: number;
    selectedPOI: POI | null;
    setSelectedPOI: (poi: POI | null) => void;
    routeCoordinates: { latitude: number; longitude: number }[] | null;
}

export default function GoogleMapsMap({
                                          location,
                                          pois,
                                          isochrone,
                                          maxRadius,
                                          selectedPOI,
                                          setSelectedPOI,
                                          routeCoordinates,
                                      }: MapProps) {
    // Process polygons to separate in-bounds and out-of-bounds segments
    const { inBoundsSegments, outOfBoundsSegments } = isochrone.coordinates.reduce(
        (
            acc: { inBoundsSegments: { latitude: number; longitude: number }[][]; outOfBoundsSegments: { latitude: number; longitude: number }[][] },
            polygon
        ) => {
            let currentSegment: { latitude: number; longitude: number }[] = [];
            let isOutOfBounds = false;

            polygon[0].forEach(([lng, lat], index) => {
                const distance = getDistanceFromLatLonInKm(location.latitude, location.longitude, lat, lng);
                const point = { latitude: lat, longitude: lng };
                const outOfBounds = distance > maxRadius / 1000; // Convert maxRadius to km

                if (outOfBounds !== isOutOfBounds) {
                    if (currentSegment.length > 0) {
                        currentSegment.push(point);
                        if (isOutOfBounds) {
                            acc.outOfBoundsSegments.push(currentSegment);
                        } else {
                            acc.inBoundsSegments.push(currentSegment);
                        }
                        currentSegment = [point];
                    }
                    isOutOfBounds = outOfBounds;
                } else {
                    currentSegment.push(point);
                }

                // Handle the last point
                if (index === polygon[0].length - 1 && currentSegment.length > 0) {
                    if (isOutOfBounds) {
                        acc.outOfBoundsSegments.push(currentSegment);
                    } else {
                        acc.inBoundsSegments.push(currentSegment);
                    }
                }
            });

            return acc;
        },
        { inBoundsSegments: [], outOfBoundsSegments: [] }
    );

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
                onPress={() => setSelectedPOI(null)} // Deselect POI when clicking outside
            >
                {/* Display POI markers */}
                {pois.map((poi) => (
                    <Marker
                        key={poi.id}
                        coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
                        title={poi.name}
                        onPress={() => setSelectedPOI(poi)} // Notify parent on POI click
                    />
                ))}

                {/* Display Isochrone in-bounds segments */}
                {inBoundsSegments.map((segment, index) => (
                    <Polyline
                        key={`inBounds-${index}`}
                        coordinates={segment}
                        strokeColor="rgba(0, 150, 255, 0.8)"
                        strokeWidth={2}
                    />
                ))}

                {/* Display Isochrone out-of-bounds segments */}
                {outOfBoundsSegments.map((segment, index) => (
                    <Polyline
                        key={`outOfBounds-${index}`}
                        coordinates={segment}
                        strokeColor="rgba(255, 0, 0, 0.8)"
                        strokeWidth={2}
                    />
                ))}

                {/* Draw the maxRadius circle */}
                <Circle
                    center={{ latitude: location.latitude, longitude: location.longitude }}
                    radius={maxRadius} // In meters
                    strokeColor="rgba(255, 0, 0, 0.5)"
                    fillColor="transparent"
                    strokeWidth={2}
                />

                {/* Display Isochrone polygons */}
                {isochrone.coordinates.map((polygon, index) => (
                    <Polygon
                        key={`isochrone-${index}`}
                        coordinates={polygon[0].map(([lng, lat]) => ({ latitude: lat, longitude: lng }))}
                        holes={polygon.slice(1).map((hole) =>
                            hole.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))
                        )}
                        fillColor="rgba(0, 150, 255, 0.3)"
                        strokeColor="rgba(0, 150, 255, 0.8)"
                        strokeWidth={2}
                    />
                ))}

                {/* Display route */}
                {routeCoordinates && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor="rgba(255, 0, 255, 0.8)" // Purple for the route
                        strokeWidth={4}
                    />
                )}
            </MapView>
        </View>
    );
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
