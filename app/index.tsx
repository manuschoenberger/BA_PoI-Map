import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    TouchableOpacity,
    SafeAreaView,
} from "react-native";
import OptionsMenu from "@/app/OptionsMenu";
import DetailsModal from "./DetailsModal";
import * as Location from "expo-location";
import MapBoxWebView from "./MapBoxWebView";
import GoogleMapsMap from "./GoogleMapsMap";
import PoiOptions from "@/app/PoiOptions";
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
import indexStyles from "@/app/utils/styles/indexStyles";

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
    const [isRouteLoading, setIsRouteLoading] = useState(false);

    // Temporary state variables for modal options
    const [tempUseMapBox, setTempUseMapBox] = useState(useMapBox);
    const [tempDataSource, setTempDataSource] = useState(dataSource);
    const [tempSelectedTime, setTempSelectedTime] = useState(selectedTime);
    const [tempTravelMode, setTempTravelMode] = useState<"driving" | "driving-traffic" | "walking" | "cycling" | "public-transport">("driving");

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
            <View style={indexStyles.loader}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Fetching location...</Text>
            </View>
        );
    }

    if (errorMsg) {
        return (
            <View style={indexStyles.loader}>
                <Text style={{ color: "red" }}>{errorMsg}</Text>
            </View>
        );
    }

    const menuOptions = [
        { label: "Mapbox", value: true },
        { label: "Google Maps", value: false },
    ];

    const poiOptions: { label: string; value: "google" | "osm" }[] = [
        { label: "Google", value: "google" },
        { label: "OpenStreetMap", value: "osm" },
    ];

    const modeOptions: { label: string; value: "driving" | "driving-traffic" | "walking" | "cycling" | "public-transport" }[] = [
        { label: "Driving", value: "driving" },
        { label: "Driving (Traffic)", value: "driving-traffic" },
        { label: "Walking", value: "walking" },
        { label: "Cycling", value: "cycling" },
        { label: "Public Transport", value: "public-transport" },
    ];

    const handleFetchRoute = async () => {
        if (!selectedPOI || !location) return;

        setIsRouteLoading(true);

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
        } finally {
            setIsRouteLoading(false);
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
        <SafeAreaView style={indexStyles.container}>
            {/* Menu Bar */}
            <View style={indexStyles.menuBar}>
                <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                    <Text style={indexStyles.menuButton}>☰</Text>
                </TouchableOpacity>
            </View>

            <OptionsMenu
                isModalVisible={isModalVisible}
                setIsModalVisible={setIsModalVisible}
                tempUseMapBox={tempUseMapBox}
                setTempUseMapBox={setTempUseMapBox}
                tempDataSource={tempDataSource}
                setTempDataSource={setTempDataSource}
                tempSelectedTime={tempSelectedTime}
                setTempSelectedTime={setTempSelectedTime}
                tempTravelMode={tempTravelMode}
                setTempTravelMode={setTempTravelMode}
                handleModalClose={handleModalClose}
                isLoading={isLoading}
                hasChanges={hasChanges}
                setHasChanges={setHasChanges}
                timeOptions={timeOptions}
                menuOptions={menuOptions}
                poiOptions={poiOptions}
                modeOptions={modeOptions}
            />

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

            {selectedPOI && (
                <PoiOptions
                    routeGeoJSON={routeGeoJSON}
                    handleClearRoute={handleClearRoute}
                    handleFetchRoute={handleFetchRoute}
                    isRouteLoading={isRouteLoading}
                    handleShowDetails={handleShowDetails}
                    isDetailsLoading={isDetailsLoading}
                />
            )}

            <DetailsModal
                isDetailsModalVisible={isDetailsModalVisible}
                setIsDetailsModalVisible={setIsDetailsModalVisible}
                poiDetails={poiDetails}
                normalizeOpeningHours={normalizeOpeningHours}
            />
        </SafeAreaView>
    );
}
