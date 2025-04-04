import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { Modal, Portal, Card, Button, Text, RadioButton, ActivityIndicator, TextInput } from "react-native-paper";
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
                                        setLocation,
                                        tempLocation,
                                        setTempLocation,
                                    }: OptionsMenuProps) {
    const [address, setAddress] = useState("");
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
    const [isResettingLocation, setIsResettingLocation] = useState(false);

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
        </Portal>
    );
}
