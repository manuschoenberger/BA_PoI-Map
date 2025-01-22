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
    const poiGeoJSON = {
        type: "FeatureCollection",
        features: pois.map((poi) => ({
            type: "Feature",
            properties: { title: poi.name },
            geometry: {
                type: "Point",
                coordinates: [poi.longitude, poi.latitude],
            },
        })),
    };

    const isochronePolygons = isochrone.coordinates
        .map(
            (polygon) => `
            {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: ${JSON.stringify(polygon)}
                },
                properties: {}
            }
        `
        )
        .join(",");

    const isochronePolygon = `
        map.on('load', () => {
            // Add Isochrone polygons
            map.addSource('iso', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [${isochronePolygons}]
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

            // Add POI Clustering
            map.addSource('pois', {
                type: 'geojson',
                data: ${JSON.stringify(poiGeoJSON)},
                cluster: true,
                clusterMaxZoom: 14, // Max zoom level for clusters
                clusterRadius: 50, // Radius of each cluster in pixels
            });

            // Add cluster layer
            map.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'pois',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': '#51bbd6',
                    'circle-radius': 20,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                },
            });

            // Add cluster count labels
            map.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'pois',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12,
                },
            });

            // Add individual POIs
            map.addLayer({
                id: 'unclustered-point',
                type: 'circle',
                source: 'pois',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': '#11b4da',
                    'circle-radius': 6,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff',
                },
            });

            map.on('click', 'unclustered-point', (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const { title } = e.features[0].properties;

                // Show a popup on click
                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(\`<strong>\${title}</strong>\`)
                    .addTo(map);
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

            // Add Isochrone Polygon and Clusters
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
