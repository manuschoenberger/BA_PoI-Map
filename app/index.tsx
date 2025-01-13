import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    Text,
    ActivityIndicator,
    Modal,
    Pressable,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
} from "react-native";
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
    const [isModalVisible, setIsModalVisible] = useState(false); // Manage modal visibility

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

    const menuOptions = [
        { label: "Mapbox", value: true },
        { label: "Google Maps", value: false },
    ];

    const poiOptions = [
        { label: "Google POI", value: "google" },
        { label: "OSM POI", value: "osm" },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Menu Bar */}
            <View style={styles.menuBar}>
                <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                    <Text style={styles.menuButton}>☰</Text>
                </TouchableOpacity>
            </View>

            {/* Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Map</Text>
                        <FlatList
                            data={menuOptions}
                            keyExtractor={(item) => item.label}
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => {
                                        setUseMapBox(item.value);
                                        setIsModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.radioOption}>
                                        {useMapBox === item.value ? "◉" : "○"} {item.label}
                                    </Text>
                                </Pressable>
                            )}
                        />
                        <Text style={styles.modalTitle}>Select POI Source</Text>
                        <FlatList
                            data={poiOptions}
                            keyExtractor={(item) => item.label}
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => {
                                        setDataSource(item.value as "google" | "osm");
                                        setIsModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.radioOption}>
                                        {dataSource === item.value ? "◉" : "○"} {item.label}
                                    </Text>
                                </Pressable>
                            )}
                        />
                        <Pressable onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Map Display */}
            {useMapBox ? (
                location && isochrone && <MapBoxWebView location={location} pois={pois} isochrone={isochrone} />
            ) : (
                location && isochrone && <GoogleMapsMap location={location} pois={pois} isochrone={isochrone} />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    menuBar: {
        backgroundColor: "#007aff",
        height: 50,
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    menuButton: {
        color: "white",
        fontSize: 18,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: 300,
        backgroundColor: "white",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    radioOption: {
        fontSize: 16,
        marginVertical: 8,
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: "#007aff",
        borderRadius: 5,
    },
    closeButtonText: {
        color: "white",
        fontSize: 16,
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
