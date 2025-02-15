import React, { useRef, useEffect } from "react";
import { StyleSheet, View, Image } from "react-native";
import MapView, { Polygon, Marker, Circle, Polyline, LatLng } from "react-native-maps";
import { LocationObjectCoords } from "expo-location";
import { POI, Isochrone } from "./utils/apiServices";
import { getDistanceFromLatLonInKm } from "./utils/distanceUtils";
import { getColorByMode } from "@/app/utils/routeColorUtils";
import { transportModeIcons } from "@/app/utils/modeIcons";
import { POI_ICONS } from "@/app/utils/poiIcons";

interface MapProps {
    location: LocationObjectCoords;
    pois: POI[];
    isochrone: Isochrone;
    maxRadius: number;
    selectedPOI: POI | null;
    setSelectedPOI: (poi: POI | null) => void;
    routeGeoJSON: { parts: { mode: string; coords: { lat: number; lng: number }[] }[] } | null;
    isDataFetched: boolean;
}

export default function GoogleMapsMap({
                                          location,
                                          pois,
                                          isochrone,
                                          maxRadius,
                                          setSelectedPOI,
                                          routeGeoJSON,
                                          isDataFetched,
                                      }: MapProps) {
    const mapRef = useRef<MapView>(null);

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

    useEffect(() => {
        if (isDataFetched && isochrone.coordinates.length > 0) {
            const isochroneCoordinates = isochrone.coordinates.flat(2).map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
            mapRef.current?.fitToCoordinates(isochroneCoordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }
    }, [isDataFetched, isochrone]);

    const customMapStyle = [
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
        },
    ];

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
                customMapStyle={customMapStyle}
                showsUserLocation={true}
                userLocationUpdateInterval={30000}
                onPress={() => setSelectedPOI(null)} // Deselect POI when clicking outside
            >
                {/* Display POI markers */}
                {pois.map((poi) => {
                    const iconSource = poi.type ? POI_ICONS[poi.type] || POI_ICONS.default : POI_ICONS.default;                    return (
                        <Marker
                            key={poi.id}
                            coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
                            title={poi.name}
                            onPress={() => setSelectedPOI(poi)} // Notify parent on POI click
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <Image
                                source={{ uri: iconSource }}
                                style={{ width: 24, height: 24, resizeMode: "contain" }}
                            />
                        </Marker>
                    );
                })}

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
        width: 20,
        height: 20,
        resizeMode: "contain",
    },
});
