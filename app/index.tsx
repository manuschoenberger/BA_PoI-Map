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
    Button,
    ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import MapBoxWebView from "./MapBoxWebView";
import GoogleMapsMap from "./GoogleMapsMap";
import {
    POI,
    fetchGooglePOIs,
    fetchOSMPOIs,
    fetchMapboxIsochrone,
    filterPOIsWithinIsochrone,
    fetchTravelTimeIsochrone,
    Isochrone,
    fetchMapboxRoute,
    fetchTravelTimeRoute,
    fetchGooglePOIDetails,
    fetchOSMPOIDetails,
} from "./utils/apiServices";

type RouteGeoJSON = {
    parts: { mode: string; coords: { lat: number; lng: number }[] }[];
};

export default function Index() {
    const [useMapBox, setUseMapBox] = useState(true);
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [pois, setPois] = useState<POI[]>([]);
    const [dataSource, setDataSource] = useState<"google" | "osm">("google");
    const [isochrone, setIsochrone] = useState<Isochrone | null>(null);
    const [selectedTime, setSelectedTime] = useState(10);
    const [travelMode, setTravelMode] = useState<"driving" | "driving-traffic" | "walking" | "cycling" | "public-transport">("driving");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
    const [routeGeoJSON, setRouteGeoJSON] = useState<RouteGeoJSON | null>(null);
    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
    const [poiDetails, setPoiDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [isDataFetched, setIsDataFetched] = useState(false);

    // Temporary state variables for modal options
    const [tempUseMapBox, setTempUseMapBox] = useState(useMapBox);
    const [tempDataSource, setTempDataSource] = useState(dataSource);
    const [tempSelectedTime, setTempSelectedTime] = useState(selectedTime);
    const [tempTravelMode, setTempTravelMode] = useState(travelMode);

    // State variable to track if changes have been made
    const [hasChanges, setHasChanges] = useState(false);

    // Default time options based on travel mode
    const timeOptionsMap: Record<
        typeof travelMode,
        { times: number[]; defaultTime: number }
    > = {
        driving: { times: [10, 15, 30, 60], defaultTime: 10 },
        "driving-traffic": { times: [10, 15, 30, 60], defaultTime: 10 },
        walking: { times: [10, 15, 30, 60], defaultTime: 10 },
        cycling: { times: [10, 15, 30, 60], defaultTime: 10 },
        "public-transport": { times: [30, 60, 120, 180], defaultTime: 30 },
    };

    const timeOptions = timeOptionsMap[tempTravelMode].times;

    // Update selected time when travel mode changes
    useEffect(() => {
        const { defaultTime } = timeOptionsMap[tempTravelMode];

        // If the current time isn't valid for the new mode, reset to the default time
        if (!timeOptions.includes(tempSelectedTime)) {
            setTempSelectedTime(defaultTime);
        }
    }, [tempTravelMode]);

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
                    let data: Isochrone;
                    if (travelMode === "public-transport") {
                        data = await fetchTravelTimeIsochrone(location.latitude, location.longitude, selectedTime);
                    } else {
                        data = await fetchMapboxIsochrone(location.latitude, location.longitude, selectedTime, travelMode);
                    }
                    setIsochrone(data);
                } catch (error) {
                    console.error("Error fetching isochrone data:", error);
                }
            };

            const debounceFetch = setTimeout(fetchIsochroneData, 300);
            return () => clearTimeout(debounceFetch);
        }
    }, [location, selectedTime, travelMode]);

    useEffect(() => {
        if (location && isochrone) {
            const fetchData = async () => {
                try {
                    let data: POI[];
                    if (dataSource === "google") {
                        data = await fetchGooglePOIs(location.latitude, location.longitude);
                    } else {
                        data = await fetchOSMPOIs(location.latitude, location.longitude);
                    }

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
        { label: "Google", value: "google" },
        { label: "OpenStreetMap", value: "osm" },
    ];

    const modeOptions = [
        { label: "Driving", value: "driving" },
        { label: "Driving (Traffic)", value: "driving-traffic" },
        { label: "Walking", value: "walking" },
        { label: "Cycling", value: "cycling" },
        { label: "Public Transport", value: "public-transport" },
    ];

    const handleFetchRoute = async () => {
        if (!selectedPOI || !location) return;

        const start: [number, number] = [location.longitude, location.latitude];
        const end: [number, number] = [selectedPOI.longitude, selectedPOI.latitude];

        try {
            let route;
            if (travelMode === "public-transport") {
                route = await fetchTravelTimeRoute(start, end);
            } else {
                route = await fetchMapboxRoute(start, end, travelMode);
            }
            setRouteGeoJSON({ parts: route.parts });
        } catch (error) {
            console.error("Error fetching route:", error);
        }
    };

    // Add a function to clear the route and deselect the PoI
    const handleClearRoute = () => {
        setRouteGeoJSON(null);
        setSelectedPOI(null);
    };

    const handleModalClose = async () => {
        setIsLoading(true);
        setUseMapBox(tempUseMapBox);
        setDataSource(tempDataSource);
        setSelectedTime(tempSelectedTime);
        setTravelMode(tempTravelMode);

        // Fetch data based on the new settings
        if (location) {
            try {
                let data: Isochrone;
                if (travelMode === "public-transport") {
                    data = await fetchTravelTimeIsochrone(location.latitude, location.longitude, tempSelectedTime);
                } else {
                    data = await fetchMapboxIsochrone(location.latitude, location.longitude, tempSelectedTime, tempTravelMode);
                }
                setIsochrone(data);

                let poisData: POI[];
                if (tempDataSource === "google") {
                    poisData = await fetchGooglePOIs(location.latitude, location.longitude);
                } else {
                    poisData = await fetchOSMPOIs(location.latitude, location.longitude);
                }

                const filteredPOIs = filterPOIsWithinIsochrone(poisData, data);
                setPois(filteredPOIs);
                setIsDataFetched(true);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }

        setIsLoading(false);
        setIsModalVisible(false);
        setHasChanges(false); // Reset hasChanges when modal is closed
    };

    const handleShowDetails = async () => {
        if (!selectedPOI) return;

        setIsDetailsLoading(true);

        try {
            let details;
            if (dataSource === "google") {
                details = await fetchGooglePOIDetails(selectedPOI.id);
            } else {
                details = await fetchOSMPOIDetails(selectedPOI.id);
            }
            setPoiDetails(details);
            setIsDetailsModalVisible(true);
        } catch (error) {
            console.error("Error fetching PoI details:", error);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const maxRadius = dataSource === "google" ? 50000 : 70000;

    const normalizeOpeningHours = (openingHours: string | string[]): string[] => {
        if (Array.isArray(openingHours)) {
            return openingHours;
        }

        // Convert OSM format "Mo-Su 16:30-24:00" to an array of strings
        const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
        const parts = openingHours.split(" ");
        const timeRange = parts[1];

        return days.map(day => `${day}: ${timeRange}`);
    };

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
                        <ScrollView contentContainerStyle={styles.scrollViewContent}>
                            <View style={styles.section}>
                                <Text style={styles.modalTitle}>Select Map</Text>
                                {menuOptions.map((item) => (
                                    <Pressable
                                        key={item.label}
                                        onPress={() => {
                                            setTempUseMapBox(item.value);
                                            setHasChanges(true);
                                        }}
                                    >
                                        <Text style={styles.radioOption}>
                                            {tempUseMapBox === item.value ? "◉" : "○"} {item.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                            <View style={styles.section}>
                                <Text style={styles.modalTitle}>Select POI Source</Text>
                                {poiOptions.map((item) => (
                                    <Pressable
                                        key={item.label}
                                        onPress={() => {
                                            setTempDataSource(item.value as "google" | "osm");
                                            setHasChanges(true);
                                        }}
                                    >
                                        <Text style={styles.radioOption}>
                                            {tempDataSource === item.value ? "◉" : "○"} {item.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                            <View style={styles.section}>
                                <Text style={styles.modalTitle}>Select Isochrone Time</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={tempSelectedTime}
                                        onValueChange={(value) => {
                                            setTempSelectedTime(value);
                                            setHasChanges(true);
                                        }}
                                        style={styles.picker}
                                        itemStyle={styles.pickerItem}
                                    >
                                        {timeOptions.map((time) => (
                                            <Picker.Item key={time} label={`${time} min`} value={time} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                            <View style={styles.section}>
                                <Text style={styles.modalTitle}>Select Travel Mode</Text>
                                {modeOptions.map((item) => (
                                    <Pressable
                                        key={item.label}
                                        onPress={() => {
                                            setTempTravelMode(item.value as typeof travelMode);
                                            setHasChanges(true);
                                        }}
                                    >
                                        <Text style={styles.radioOption}>
                                            {tempTravelMode === item.value ? "◉" : "○"} {item.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                            <Pressable onPress={handleModalClose} style={styles.closeButton}>
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.closeButtonText}>{hasChanges ? "Apply & Close" : "Close"}</Text>
                                )}
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Map Display */}
            {useMapBox ? (
                location && isochrone && (
                    <MapBoxWebView
                        location={location}
                        pois={pois}
                        isochrone={isochrone}
                        maxRadius={maxRadius}
                        selectedPOI={selectedPOI}
                        setSelectedPOI={setSelectedPOI}
                        routeGeoJSON={routeGeoJSON}
                        isDataFetched={isDataFetched}
                    />
                )
            ) : (
                location && isochrone && (
                    <GoogleMapsMap
                        location={location}
                        pois={pois}
                        isochrone={isochrone}
                        maxRadius={maxRadius}
                        selectedPOI={selectedPOI}
                        setSelectedPOI={setSelectedPOI}
                        routeGeoJSON={routeGeoJSON}
                        isDataFetched={isDataFetched}
                    />
                )
            )}

            {/* Directions and Show Details Buttons */}
            {selectedPOI && (
                <View style={styles.buttonContainer}>
                    <Button
                        title={routeGeoJSON ? "Clear Route" : "Directions"}
                        onPress={routeGeoJSON ? handleClearRoute : handleFetchRoute}
                    />
                    <Pressable onPress={handleShowDetails} style={styles.detailsButton} disabled={isDetailsLoading}>
                        {isDetailsLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.detailsButtonText}>Show Details</Text>
                        )}
                    </Pressable>
                </View>
            )}

            {/* Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isDetailsModalVisible}
                onRequestClose={() => setIsDetailsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{poiDetails?.name}</Text>
                        <ScrollView style={styles.scrollView}>
                            {poiDetails ? (
                                <View>
                                    <Text style={styles.detailText}>Type: {poiDetails.type}</Text>
                                    <Text style={styles.detailText}>Address: {poiDetails.address}</Text>
                                    <Text style={styles.detailText}>Phone: {poiDetails.phone}</Text>
                                    <Text style={styles.detailText}>Website: {poiDetails.website}</Text>
                                    <Text style={styles.detailText}>Opening Hours:</Text>
                                    {Array.isArray(poiDetails.openingHours) || typeof poiDetails.openingHours === 'string' ? (
                                        normalizeOpeningHours(poiDetails.openingHours).map((hours: string, index: number) => (
                                            <Text key={index} style={styles.openingHoursText}>{hours}</Text>
                                        ))
                                    ) : (
                                        <Text style={styles.detailText}>No opening hours available</Text>
                                    )}
                                    <Text style={styles.detailText}>Rating: {poiDetails.rating}</Text>
                                    <Text style={styles.detailText}>Reviews:</Text>
                                    {Array.isArray(poiDetails.reviews) ? (
                                        poiDetails.reviews.map((review: string, index: number) => (
                                            <Text key={index} style={styles.reviewText}>"{review}"</Text>
                                        ))
                                    ) : (
                                        <Text style={styles.detailText}>No reviews available</Text>
                                    )}
                                </View>
                            ) : (
                                <ActivityIndicator size="large" color="#0000ff" />
                            )}
                        </ScrollView>
                        <Pressable onPress={() => setIsDetailsModalVisible(false)} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
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
    },
    picker: {
        width: "100%",
        height: 60,
    },
    pickerItem: {
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
        maxHeight: "80%",
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
        alignItems: "center",
    },
    closeButtonText: {
        color: "white",
        fontSize: 16,
    },
    buttonContainer: {
        position: "absolute",
        bottom: 10,
        left: 10,
        right: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scrollView: {
        maxHeight: "70%",
    },
    detailText: {
        fontSize: 14,
        marginVertical: 8,
    },
    openingHoursText: {
        fontSize: 14,
    },
    reviewText: {
        fontSize: 14,
        marginVertical: 8,
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    section: {
        width: "100%",
        padding: 10,
        marginVertical: 10,
        backgroundColor: "#f9f9f9",
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    detailsButton: {
        padding: 10,
        backgroundColor: "#007aff",
        borderRadius: 5,
        alignItems: "center",
    },
    detailsButtonText: {
        color: "white",
        fontSize: 16,
    },
});
