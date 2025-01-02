import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { MAPBOX_API_KEY } from "@env";
import { LocationObjectCoords } from "expo-location";
import { POI } from "./apiServices";

interface MapBoxWebViewProps {
    location: LocationObjectCoords;
    pois: POI[];
}

export default function MapBoxWebView({ location, pois }: MapBoxWebViewProps) {
    const poiMarkers = pois
        .map(
            (poi) => `
            new mapboxgl.Marker()
                .setLngLat([${poi.longitude}, ${poi.latitude}])
                .setPopup(new mapboxgl.Popup().setText("${poi.name}"))
                .addTo(map);
        `
        )
        .join("");

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://api.mapbox.com/mapbox-gl-js/v2.8.2/mapbox-gl.js"></script>
        <link href="https://api.mapbox.com/mapbox-gl-js/v2.8.2/mapbox-gl.css" rel="stylesheet" />
        <style>
            body { margin: 0; padding: 0; }
            #map { width: 100vw; height: 100vh; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            mapboxgl.accessToken = '${MAPBOX_API_KEY}';
            const map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [${location.longitude}, ${location.latitude}],
                zoom: 12
            });

            // Add current location marker
            new mapboxgl.Marker({ color: 'blue' })
                .setLngLat([${location.longitude}, ${location.latitude}])
                .setPopup(new mapboxgl.Popup().setText("You are here"))
                .addTo(map);

            // Add POI markers
            ${poiMarkers}
        </script>
    </body>
    </html>
    `;

    return (
        <View style={styles.container}>
            <WebView originWhitelist={["*"]} source={{ html }} style={styles.map} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
});
