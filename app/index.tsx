import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    Text,
    ActivityIndicator,
    Modal,
    Pressable,
    TouchableOpacity,
    SafeAreaView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import MapBoxWebView from "./MapBoxWebView";
import GoogleMapsMap from "./GoogleMapsMap";
import { POI, fetchGooglePOIs, fetchOSMPOIs, fetchMapboxIsochrone, filterPOIsWithinIsochrone, fetchTravelTimeIsochrone } from "./utils/apiServices";

export default function Index() {
    const [useMapBox, setUseMapBox] = useState(true);
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [pois, setPois] = useState<POI[]>([]);
    const [dataSource, setDataSource] = useState<"google" | "osm">("google");
    const [isochrone, setIsochrone] = useState<{ coordinates: [number, number][] } | null>(null);
    const [selectedTime, setSelectedTime] = useState(10); // Default is 10 minutes
    const [travelMode, setTravelMode] = useState<"driving" | "driving-traffic" | "walking" | "cycling" | "public-transport">("driving"); // Default is driving
    const [isModalVisible, setIsModalVisible] = useState(false);

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
                    let data;
                    if (travelMode === "public-transport") {
                        data = await fetchTravelTimeIsochrone(location.latitude, location.longitude, selectedTime);
                    } else {
                        data = await fetchMapboxIsochrone(
                            location.latitude,
                            location.longitude,
                            selectedTime,
                            travelMode
                        );
                    }
                    setIsochrone(data);
                } catch (error) {
                    console.error("Error fetching isochrone data:", error);
                }
            };
            fetchIsochroneData();
        }
    }, [location, selectedTime, travelMode]); // Re-fetch when time or mode changes

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

    // Dynamic time options based on the travel mode
    const timeOptions =
        travelMode === "public-transport"
            ? [30, 60, 120, 180] // Public transport: 30min, 1hr, 2hr, 3hr
            : [10, 15, 30, 60]; // Driving, Walking, Cycling: 10min, 15min, 30min, 1hr

    const modeOptions = [
        { label: "Driving", value: "driving" },
        { label: "Driving (Traffic)", value: "driving-traffic" },
        { label: "Walking", value: "walking" },
        { label: "Cycling", value: "cycling" },
        { label: "Public Transport", value: "public-transport" },
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
                        {menuOptions.map((item) => (
                            <Pressable
                                key={item.label}
                                onPress={() => setUseMapBox(item.value)}
                            >
                                <Text style={styles.radioOption}>
                                    {useMapBox === item.value ? "◉" : "○"} {item.label}
                                </Text>
                            </Pressable>
                        ))}
                        <Text style={styles.modalTitle}>Select POI Source</Text>
                        {poiOptions.map((item) => (
                            <Pressable
                                key={item.label}
                                onPress={() => setDataSource(item.value as "google" | "osm")}
                            >
                                <Text style={styles.radioOption}>
                                    {dataSource === item.value ? "◉" : "○"} {item.label}
                                </Text>
                            </Pressable>
                        ))}
                        <Text style={styles.modalTitle}>Select Isochrone Time</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedTime}
                                onValueChange={(value) => setSelectedTime(value)}
                                style={styles.picker}
                                dropdownIconColor="#007aff"
                            >
                                {timeOptions.map((time) => (
                                    <Picker.Item key={time} label={`${time} min`} value={time} />
                                ))}
                            </Picker>
                        </View>
                        <Text style={styles.modalTitle}>Select Travel Mode</Text>
                        {modeOptions.map((item) => (
                            <Pressable
                                key={item.label}
                                onPress={() => setTravelMode(item.value as typeof travelMode)}
                            >
                                <Text style={styles.radioOption}>
                                    {travelMode === item.value ? "◉" : "○"} {item.label}
                                </Text>
                            </Pressable>
                        ))}
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
    pickerContainer: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 5,
        marginVertical: 10,
        backgroundColor: "#fff",
        zIndex: 1000, // Ensure the dropdown appears above other elements
    },
    picker: {
        width: "100%",
        height: 50,
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
