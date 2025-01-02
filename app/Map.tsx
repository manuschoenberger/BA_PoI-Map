import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function App() {
    return (
        <View style={styles.container}>
        <MapView
            style={styles.map}
    initialRegion={{
        latitude: 48.8566, // Default: Paris coordinates
            longitude: 2.3522,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
    }}
>
    {/* Example Marker */}
    <Marker
        coordinate={{ latitude: 48.8566, longitude: 2.3522 }}
    title="Default Location"
    description="This is a starting point."
        />
        </MapView>
        </View>
);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        width: '100%',
        height: '100%',
    },
});
