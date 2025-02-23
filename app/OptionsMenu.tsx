import React from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Modal } from "react-native";
import { Picker } from "@react-native-picker/picker";
import indexStyles from "@/app/utils/styles/indexStyles";

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
                                    }: OptionsMenuProps ) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => setIsModalVisible(false)}
        >
            <View style={indexStyles.modalContainer}>
                <View style={indexStyles.modalContent}>
                    <ScrollView contentContainerStyle={indexStyles.scrollViewContent}>
                        <View style={indexStyles.section}>
                            <Text style={indexStyles.modalTitle}>Select Map</Text>
                            {menuOptions.map((item) => (
                                <Pressable
                                    key={item.label}
                                    onPress={() => {
                                        setTempUseMapBox(item.value);
                                        setHasChanges(true);
                                    }}
                                >
                                    <Text style={indexStyles.radioOption}>
                                        {tempUseMapBox === item.value ? "◉" : "○"} {item.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                        <View style={indexStyles.section}>
                            <Text style={indexStyles.modalTitle}>Select POI Source</Text>
                            {poiOptions.map((item) => (
                                <Pressable
                                    key={item.label}
                                    onPress={() => {
                                        setTempDataSource(item.value as "google" | "osm");
                                        setHasChanges(true);
                                    }}
                                >
                                    <Text style={indexStyles.radioOption}>
                                        {tempDataSource === item.value ? "◉" : "○"} {item.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                        <View style={indexStyles.section}>
                            <Text style={indexStyles.modalTitle}>Select Isochrone Time</Text>
                            <View style={indexStyles.pickerContainer}>
                                <Picker
                                    selectedValue={tempSelectedTime}
                                    onValueChange={(value) => {
                                        setTempSelectedTime(value);
                                        setHasChanges(true);
                                    }}
                                    style={indexStyles.picker}
                                    itemStyle={indexStyles.pickerItem}
                                >
                                    {timeOptions.map((time) => (
                                        <Picker.Item key={time} label={`${time} min`} value={time} />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                        <View style={indexStyles.section}>
                            <Text style={indexStyles.modalTitle}>Select Travel Mode</Text>
                            {modeOptions.map((item) => (
                                <Pressable
                                    key={item.label}
                                    onPress={() => {
                                        setTempTravelMode(item.value);
                                        setHasChanges(true);
                                    }}
                                >
                                    <Text style={indexStyles.radioOption}>
                                        {tempTravelMode === item.value ? "◉" : "○"} {item.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                        <Pressable onPress={handleModalClose} style={indexStyles.closeButton}>
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={indexStyles.closeButtonText}>{hasChanges ? "Apply & Close" : "Close"}</Text>
                            )}
                        </Pressable>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};
