import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Polygon, Marker } from "react-native-maps";
import { LocationObjectCoords } from "expo-location";
import { POI, Isochrone } from "./utils/apiServices";

interface MapProps {
    location: LocationObjectCoords;
    pois: POI[];
    isochrone: Isochrone;
}

export default function GoogleMapsMap({ location, pois, isochrone }: MapProps) {
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
                <Polygon
                    coordinates={isochrone.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))}
                    fillColor="rgba(0, 150, 255, 0.3)"
                    strokeColor="rgba(0, 150, 255, 0.8)"
                    strokeWidth={2}
                />
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
