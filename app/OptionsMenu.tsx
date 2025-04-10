import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import {
    Modal,
    Portal,
    Card,
    Button,
    Text,
    RadioButton,
    ActivityIndicator,
    TextInput,
    Checkbox
} from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import styles from "@/app/utils/styles/styles";
import * as Location from "expo-location";
import { geocodeAddress } from "./utils/apiServices";

type OptionsMenuProps = {
    isModalVisible: boolean;
    setIsModalVisible: (visible: boolean) => void;
    tempUseMapBox: boolean;
    setTempUseMapBox: (useMapBox: boolean) => void;
    tempDataSource: "google" | "osm";
    setTempDataSource: (dataSource: "google" | "osm") => void;
    tempSelectedTime: number;
    setTempSelectedTime: (time: number) => void;
    tempTravelMode: "driving" | "driving-traffic" | "walking" | "cycling" | "public-transport";
    setTempTravelMode: (mode: "driving" | "driving-traffic" | "walking" | "cycling" | "public-transport") => void;
    handleModalClose: () => void;
    isLoading: boolean;
    hasChanges: boolean;
    setHasChanges: (hasChanges: boolean) => void;
    timeOptions: number[];
    menuOptions: { label: string; value: boolean }[];
    poiOptions: { label: string; value: "google" | "osm" }[];
    modeOptions: { label: string; value: "driving" | "driving-traffic" | "walking" | "cycling" | "public-transport" }[];
    setLocation: (coords: Location.LocationObjectCoords | null) => void;
    tempLocation: Location.LocationObjectCoords | null;
    setTempLocation: (coords: Location.LocationObjectCoords | null) => void;
    setTempSelectedTypes: (types: string[]) => void;
    tempSelectedTypes: string[];
};

const googleTypes: Record<string, string> = {
    tourist_attraction: "Tourist Spot",
    museum: "Museum",
    park: "Park",
    restaurant: "Restaurant",
    cafe: "Cafe",
    shopping_mall: "Shopping Mall",
    zoo: "Zoo",
    amusement_park: "Amusement Park",
    aquarium: "Aquarium",
    art_gallery: "Art Gallery",
    night_club: "Night Club",
    casino: "Casino",
    bar: "Bar",
    bowling_alley: "Bowling Alley",
    campground: "Campground",
    car_rental: "Car Rental",
    pharmacy: "Pharmacy",
    clothing_store: "Clothing Store",
    convenience_store: "Convenience Store",
    book_store: "Book Store",
    department_store: "Department Store",
    doctor: "Doctor",
    drugstore: "Drugstore",
    shoe_store: "Shoe Store",
    electronics_store: "Electronics Store",
    spa: "Spa",
    store: "Store",
    gas_station: "Gas Station",
    supermarket: "Supermarket",
    gym: "Gym",
    hardware_store: "Hardware Store",
    hospital: "Hospital",
    jewelry_store: "Jewelry Store",
};

const osmTypes: Record<string, string> = {
    restaurant: "Restaurant",
    cafe: "Cafe",
    park: "Park",
    museum: "Museum",
    hotel: "Hotel",
    tourist_attraction: "Tourist Spot",
    store: "Store",
};

export default function OptionsMenu({
                                        isModalVisible,
                                        setIsModalVisible,
                                        tempUseMapBox,
                                        setTempUseMapBox,
                                        tempDataSource,
                                        setTempDataSource,
                                        tempSelectedTime,
                                        setTempSelectedTime,
                                        tempTravelMode,
                                        setTempTravelMode,
                                        handleModalClose,
                                        isLoading,
                                        hasChanges,
                                        setHasChanges,
                                        timeOptions,
                                        menuOptions,
                                        poiOptions,
                                        modeOptions,
                                        setTempSelectedTypes,
                                        tempSelectedTypes,
                                        setTempLocation,
                                    }: OptionsMenuProps) {
    const [address, setAddress] = useState("");
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
    const [isResettingLocation, setIsResettingLocation] = useState(false);
    const [isTypeDropdownVisible, setIsTypeDropdownVisible] = useState(false);

    const handleGeocodeAddress = async () => {
        setIsGeocoding(true);
        try {
            const location = await geocodeAddress(address);
            const convertedLocation: Location.LocationObjectCoords = {
                latitude: location.latitude,
                longitude: location.longitude,
                altitude: null,
                accuracy: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
            };
            setTempLocation(convertedLocation);
            setHasChanges(true);
            setIsAddressModalVisible(false);
        } catch (error) {
            console.error("Error geocoding address:", error);
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleResetLocation = async () => {
        setIsResettingLocation(true);
        try {
            let currentLocation = await Location.getCurrentPositionAsync({});
            setTempLocation(currentLocation.coords);
            setAddress("");
            setHasChanges(true);
            setIsAddressModalVisible(false);
        } catch (error) {
            console.error("Error resetting location:", error);
        } finally {
            setIsResettingLocation(false);
        }
    };

    const availableTypes = tempDataSource === "google" ? googleTypes : osmTypes;

    const toggleTypeSelection = (type: string) => {
        if (tempSelectedTypes.includes(type)) {
            setTempSelectedTypes(tempSelectedTypes.filter((t) => t !== type));
        } else {
            setTempSelectedTypes([...tempSelectedTypes, type]);
        }
    };

    return (
        <Portal>
            <Modal visible={isModalVisible} onDismiss={() => setIsModalVisible(false)} contentContainerStyle={styles.modalContainer}>
                <Card style={styles.modalCard}>
                    <Card.Content style={styles.cardContent}>
                        <ScrollView contentContainerStyle={styles.scrollViewContent}>
                            <Text style={[styles.modalTitle, styles.sectionTitle]}>Select Map</Text>
                            <RadioButton.Group onValueChange={(value) => { setTempUseMapBox(value === "true"); setHasChanges(true); }} value={tempUseMapBox.toString()}>
                                {menuOptions.map((item) => (
                                    <RadioButton.Item key={item.label} label={item.label} value={item.value.toString()} />
                                ))}
                            </RadioButton.Group>

                            <Text style={[styles.modalTitle, styles.sectionTitle]}>Select POI Source</Text>
                            <RadioButton.Group onValueChange={(value) => { setTempDataSource(value as "google" | "osm"); setHasChanges(true); }} value={tempDataSource}>
                                {poiOptions.map((item) => (
                                    <RadioButton.Item key={item.label} label={item.label} value={item.value} />
                                ))}
                            </RadioButton.Group>

                            <Button onPress={() => setIsTypeDropdownVisible(true)} mode="contained" style={styles.geocodeButton}>
                                Select POI Types
                            </Button>

                            <Text style={[styles.modalTitle, styles.sectionTitle]}>Select Travel Time</Text>
                            <Picker selectedValue={tempSelectedTime} onValueChange={(value) => { setTempSelectedTime(value); setHasChanges(true); }} style={styles.picker} itemStyle={styles.pickerItem}>
                                {timeOptions.map((time) => (
                                    <Picker.Item key={time} label={`${time} min`} value={time} />
                                ))}
                            </Picker>

                            <Text style={[styles.modalTitle, styles.sectionTitle]}>Select Custom Location</Text>
                            <Button onPress={() => setIsAddressModalVisible(true)} mode="contained" style={styles.geocodeButton}>
                                Set Location
                            </Button>

                            <Text style={[styles.modalTitle, styles.sectionTitle]}>Select Travel Mode</Text>
                            <RadioButton.Group onValueChange={(value) => { setTempTravelMode(value as "driving" | "driving-traffic" | "walking" | "cycling" | "public-transport"); setHasChanges(true); }} value={tempTravelMode}>
                                {modeOptions.map((item) => (
                                    <RadioButton.Item key={item.label} label={item.label} value={item.value} />
                                ))}
                            </RadioButton.Group>

                            <Button onPress={handleModalClose} mode="contained" style={styles.closeButton}>
                                {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.closeButtonText}>{hasChanges ? "Apply & Close" : "Close"}</Text>}
                            </Button>
                        </ScrollView>
                    </Card.Content>
                </Card>
            </Modal>

            <Modal visible={isAddressModalVisible} onDismiss={() => setIsAddressModalVisible(false)} contentContainerStyle={styles.modalContainer}>
                <Card style={styles.modalCard}>
                    <Card.Content style={styles.cardContent}>
                        <Text style={styles.modalTitle}>Enter Location</Text>
                        <TextInput
                            label="Enter Address"
                            value={address}
                            onChangeText={setAddress}
                            style={styles.textInput}
                        />
                        <Button onPress={handleGeocodeAddress} mode="contained" style={styles.geocodeButton} disabled={isGeocoding}>
                            {isGeocoding ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.geocodeButtonText}>Apply</Text>}
                        </Button>
                        <Button onPress={handleResetLocation} mode="contained" style={styles.resetButton} disabled={isResettingLocation}>
                            {isResettingLocation ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.geocodeButtonText}>Reset Location</Text>}
                        </Button>
                    </Card.Content>
                </Card>
            </Modal>

            <Modal visible={isTypeDropdownVisible} onDismiss={() => setIsTypeDropdownVisible(false)} contentContainerStyle={styles.modalContainer}>
                <Card style={styles.modalCard}>
                    <Card.Content style={styles.cardContent}>
                        <Text style={styles.modalTitle}>Select POI Types</Text>
                        <ScrollView style={{ maxHeight: 450 }}>
                            {Object.keys(availableTypes).map((type) => (
                                <View key={type} style={{ flexDirection: "row", alignItems: "center" }}>
                                    <Checkbox
                                        status={tempSelectedTypes.includes(type) ? "checked" : "unchecked"}
                                        onPress={() => toggleTypeSelection(type)}
                                    />
                                    <Text>{availableTypes[type]}</Text>
                                </View>
                            ))}
                        </ScrollView>
                        <Button onPress={() => setIsTypeDropdownVisible(false)} mode="contained" style={styles.closeButton}>
                            Close
                        </Button>
                    </Card.Content>
                </Card>
            </Modal>
        </Portal>
    );
}

export { googleTypes, osmTypes };
