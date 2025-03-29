import React from "react";
import { ScrollView } from "react-native";
import { Modal, Portal, Card, Button, Text, RadioButton, ActivityIndicator } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import styles from "@/app/utils/styles/styles";

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
                                    }: OptionsMenuProps) {
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
        </Portal>
    );
}
