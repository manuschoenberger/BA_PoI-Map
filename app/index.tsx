import React, { useEffect, useState } from "react";
import { Button, View, StyleSheet, Text, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import MapBoxWebView from "./MapBoxWebView";
import GoogleMapsMap from "./GoogleMapsMap";
import { fetchGooglePOIs, fetchOSMPOIs, POI } from "./utils/apiServices";

export default function Index() {
    const [useMapBox, setUseMapBox] = useState(true);
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [pois, setPois] = useState<POI[]>([]);
    const [dataSource, setDataSource] = useState<"google" | "osm">("google"); // Removed "mapbox" as a data source

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                setErrorMsg("Permission to access location was denied");
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation.coords);
        })();
    }, []);

    useEffect(() => {
        if (location) {
            // Fetch POIs based on the selected data source
            const fetchData = async () => {
                let data: POI[] = [];
                switch (dataSource) {
                    case "google":
                        data = await fetchGooglePOIs(location.latitude, location.longitude);
                        break;
                    case "osm":
                        data = await fetchOSMPOIs(location.latitude, location.longitude);
                        break;
                }
                setPois(data);
            };
            fetchData();
        }
    }, [location, dataSource]);

    if (!location && !errorMsg) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Fetching location...</Text>
            </View>
        );
    }

    if (errorMsg) {
        return (
            <View style={styles.loader}>
                <Text style={{ color: "red" }}>{errorMsg}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.buttonContainer}>
                <Button
                    title={`Switch to ${useMapBox ? "Google Maps" : "MapBox"}`}
                    onPress={() => setUseMapBox(!useMapBox)}
                />
                <Button
                    title={`PoI Source: ${dataSource}`}
                    onPress={() =>
                        setDataSource(
                            dataSource === "google" ? "osm" : "google" // Switching between Google and OSM only
                        )
                    }
                />
            </View>
            {useMapBox ? (
                location && <MapBoxWebView location={location} pois={pois} />
            ) : (
                location && <GoogleMapsMap location={location} pois={pois} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    buttonContainer: {
        position: "absolute",
        top: 40,
        zIndex: 10,
        alignSelf: "center",
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
