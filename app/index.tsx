import React, { useState } from "react";
import { Button, View, StyleSheet } from "react-native";
import MapBoxWebView from "./MapBoxWebView";
import Map from "./Map";

export default function Index() {
    const [useMapBox, setUseMapBox] = useState(true);

    return (
        <View style={styles.container}>
            <View style={styles.buttonContainer}>
                <Button
                    title={`Switch to ${useMapBox ? "Google Maps" : "MapBox"}`}
                    onPress={() => setUseMapBox(!useMapBox)}
                />
            </View>
            {useMapBox ? <MapBoxWebView /> : <Map />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    buttonContainer: {
        position: "absolute",
        top: 40,
        zIndex: 10,
        alignSelf: "center",
    },
});
