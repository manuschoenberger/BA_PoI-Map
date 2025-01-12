import React, { useEffect, useState } from "react";
import { Button, View, StyleSheet, Text, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import MapBoxWebView from "./MapBoxWebView";
import GoogleMapsMap from "./GoogleMapsMap";
import { POI, fetchGooglePOIs, fetchOSMPOIs, fetchMapboxIsochrone, filterPOIsWithinIsochrone } from "./utils/apiServices";

export default function Index() {
    const [useMapBox, setUseMapBox] = useState(true);
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [pois, setPois] = useState<POI[]>([]);
    const [dataSource, setDataSource] = useState<"google" | "osm">("google");
    const [isochrone, setIsochrone] = useState<{ coordinates: [number, number][] } | null>(null);

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
            const fetchIsochroneData = async () => {
                try {
                    const data = await fetchMapboxIsochrone(location.latitude, location.longitude);
                    setIsochrone(data);
                } catch (error) {
                    console.error("Error fetching isochrone data:", error);
                }
            };
            fetchIsochroneData();
        }
    }, [location]);

    useEffect(() => {
        if (location && isochrone) {
            const fetchData = async () => {
                try {
                    let data: POI[] = [];
                    if (dataSource === "google") {
                        data = await fetchGooglePOIs(location.latitude, location.longitude);
                    } else {
                        data = await fetchOSMPOIs(location.latitude, location.longitude);
                    }

                    // Filter POIs within the isochrone
                    const filteredPOIs = filterPOIsWithinIsochrone(data, isochrone);
                    setPois(filteredPOIs);
                } catch (error) {
                    console.error("Error fetching POIs:", error);
                }
            };
            fetchData();
        }
    }, [location, isochrone, dataSource]);

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
                        setDataSource(dataSource === "google" ? "osm" : "google")
                    }
                />
            </View>
            {useMapBox ? (
                location && isochrone && <MapBoxWebView location={location} pois={pois} isochrone={isochrone} />
            ) : (
                location && isochrone && <GoogleMapsMap location={location} pois={pois} isochrone={isochrone} />
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
