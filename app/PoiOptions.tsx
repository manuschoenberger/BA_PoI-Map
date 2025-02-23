import React from "react";
import { View, Pressable, ActivityIndicator, Image } from "react-native";
import indexStyles from "@/app/utils/styles/indexStyles";
import { BUTTON_ICONS } from './utils/buttonIcons';

type PoiOptionsProps = {
    routeGeoJSON: any;
    handleClearRoute: () => void;
    handleFetchRoute: () => void;
    isRouteLoading: boolean;
    handleShowDetails: () => void;
    isDetailsLoading: boolean;
};

export default function PoiOptions({
                                                       routeGeoJSON,
                                                       handleClearRoute,
                                                       handleFetchRoute,
                                                       isRouteLoading,
                                                       handleShowDetails,
                                                       isDetailsLoading,
                                                   }: PoiOptionsProps ) {
    return (
        <View style={indexStyles.buttonContainer}>
            <Pressable onPress={routeGeoJSON ? handleClearRoute : handleFetchRoute} style={indexStyles.detailsButton} disabled={isRouteLoading}>
                {isRouteLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Image source={{ uri: routeGeoJSON ? BUTTON_ICONS.clearRoute : BUTTON_ICONS.directions }} style={indexStyles.icon} />
                )}
            </Pressable>
            <Pressable onPress={handleShowDetails} style={indexStyles.detailsButton} disabled={isDetailsLoading}>
                {isDetailsLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Image source={{ uri: BUTTON_ICONS.showDetails }} style={indexStyles.icon} />
                )}
            </Pressable>
        </View>
    );
};
