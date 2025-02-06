import React, { useRef, useEffect, useState } from "react";
import { StyleSheet, View, Image } from "react-native";
import MapView, { Polygon, Marker, Circle, Polyline, LatLng } from "react-native-maps";
import { LocationObjectCoords } from "expo-location";
import { POI, Isochrone } from "./utils/apiServices";
import { getDistanceFromLatLonInKm } from "./utils/distanceUtils";
import { getColorByMode } from "@/app/utils/routeColorUtils";
import { transportModeIcons } from "@/app/utils/modeIcons";

interface MapProps {
    location: LocationObjectCoords;
    pois: POI[];
    isochrone: Isochrone;
    maxRadius: number;
    selectedPOI: POI | null;
    setSelectedPOI: (poi: POI | null) => void;
    routeGeoJSON: { parts: { mode: string; coords: { lat: number; lng: number }[] }[] } | null;
}

export default function GoogleMapsMap({
                                          location,
                                          pois,
                                          isochrone,
                                          maxRadius,
                                          setSelectedPOI,
                                          routeGeoJSON,
                                      }: MapProps) {
    const mapRef = useRef<MapView>(null);
    const [prevIsochroneSize, setPrevIsochroneSize] = useState<number | null>(null);
    const [prevPOICount, setPrevPOICount] = useState<number>(0);

    const { inBoundsSegments, outOfBoundsSegments } = isochrone.coordinates.reduce(
        (
            acc: { inBoundsSegments: LatLng[][]; outOfBoundsSegments: LatLng[][] },
            polygon
        ) => {
            let currentSegment: LatLng[] = [];
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

    const isochroneCoordinates = isochrone.coordinates.flat(2).map(([lng, lat]) => ({ latitude: lat, longitude: lng }));

    useEffect(() => {
        const currentIsochroneSize = isochroneCoordinates.length;
        const currentPOICount = pois.length;

        if (currentIsochroneSize !== prevIsochroneSize || currentPOICount !== prevPOICount) {
            if (isochroneCoordinates.length > 0) {
                mapRef.current?.fitToCoordinates(isochroneCoordinates, {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true,
                });
            }
            setPrevIsochroneSize(currentIsochroneSize);
            setPrevPOICount(currentPOICount);
        }
    }, [isochroneCoordinates, pois]);

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
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
                    strokeColor="rgba(255, 0, 0, 0.3)"
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
                {routeGeoJSON && routeGeoJSON.parts.map((part, index) => (
                    <Polyline
                        key={`route-part-${index}`}
                        coordinates={part.coords.map(coord => ({ latitude: coord.lat, longitude: coord.lng }))}
                        strokeColor={getColorByMode(part.mode)}
                        strokeWidth={4}
                    />
                ))}

                {/* Display mode icons at the start of each route section */}
                {routeGeoJSON && routeGeoJSON.parts.map((part, index) => {
                    const startCoord = part.coords[0]; // First point of the section
                    const iconSource = transportModeIcons[part.mode];

                    if (!startCoord || !iconSource) return null;

                    return (
                        <Marker
                            key={`mode-icon-${index}`}
                            coordinate={{ latitude: startCoord.lat, longitude: startCoord.lng }}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <Image source={iconSource} style={styles.icon} />
                        </Marker>
                    );
                })}
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
    icon: {
        width: 30,  // Adjust as needed
        height: 30,
        resizeMode: "contain",
    },
});
