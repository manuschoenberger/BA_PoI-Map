import React from "react";
import { View, Pressable, ActivityIndicator, Image } from "react-native";
import styles from "@/app/utils/styles/styles";
import { BUTTON_ICONS } from './utils/buttonIcons';

type PoiOptionsProps = {
    routeGeoJSON: any;
    handleClearRoute: () => void;
    handleFetchRoute: () => void;
    isRouteLoading: boolean;
    handleShowDetails: () => void;
    isDetailsLoading: boolean;
    setIsRouteInstructionsVisible: (visible: boolean) => void;
    isInstructionsLoading: boolean;
};

export default function PoiOptions({
                                                       routeGeoJSON,
                                                       handleClearRoute,
                                                       handleFetchRoute,
                                                       isRouteLoading,
                                                       handleShowDetails,
                                                       isDetailsLoading,
                                                       setIsRouteInstructionsVisible,
                                                       isInstructionsLoading,
                                                   }: PoiOptionsProps ) {
    return (
        <View style={styles.buttonContainer}>
            <Pressable onPress={routeGeoJSON ? handleClearRoute : handleFetchRoute} style={styles.detailsButton} disabled={isRouteLoading}>
                {isRouteLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Image source={{ uri: routeGeoJSON ? BUTTON_ICONS.clearRoute : BUTTON_ICONS.directions }} style={styles.icon} />
                )}
            </Pressable>
            <Pressable onPress={handleShowDetails} style={styles.detailsButton} disabled={isDetailsLoading}>
                {isDetailsLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Image source={{ uri: BUTTON_ICONS.showDetails }} style={styles.icon} />
                )}
            </Pressable>
            {routeGeoJSON && (
                <Pressable onPress={() => setIsRouteInstructionsVisible(true)} style={styles.detailsButton} disabled={isInstructionsLoading}>
                    {isInstructionsLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Image source={{ uri: BUTTON_ICONS.showInstructions }} style={styles.icon} />
                    )}
                </Pressable>
            )}
        </View>
    );
};
