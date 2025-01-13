import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { LocationObjectCoords } from "expo-location";
import { POI, Isochrone } from "./utils/apiServices";

const apiKey = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;

interface MapBoxWebViewProps {
    location: LocationObjectCoords;
    pois: POI[];
    isochrone: Isochrone;
}

export default function MapBoxWebView({ location, pois, isochrone }: MapBoxWebViewProps) {
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

    const isochronePolygon = `
        map.on('load', () => {
            map.addSource('iso', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [${JSON.stringify(isochrone.coordinates)}]
                        },
                        properties: {}
                    }]
                }
            });

            map.addLayer({
                id: 'isoLayer',
                type: 'fill',
                source: 'iso',
                layout: {},
                paint: {
                    'fill-color': '#007cbf',
                    'fill-opacity': 0.3
                }
            });

            // Add blue dot for current location
            map.addSource('currentLocation', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [${location.longitude}, ${location.latitude}]
                    }
                }
            });

            map.addLayer({
                id: 'currentLocationLayer',
                type: 'circle',
                source: 'currentLocation',
                paint: {
                    'circle-radius': 8,
                    'circle-color': '#0000ff',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff'
                }
            });
        });
    `;

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
            mapboxgl.accessToken = '${apiKey}';
            const map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [${location.longitude}, ${location.latitude}],
                zoom: 12
            });

            // Add POI markers
            ${poiMarkers}

            // Add Isochrone Polygon
            ${isochronePolygon}
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
