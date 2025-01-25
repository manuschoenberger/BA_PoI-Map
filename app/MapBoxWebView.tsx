import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { LocationObjectCoords } from "expo-location";
import { POI, Isochrone } from "./utils/apiServices";
import { getDistanceFromLatLonInKm } from "./utils/distanceUtils";

const apiKey = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;

interface MapBoxWebViewProps {
    location: LocationObjectCoords;
    pois: POI[];
    isochrone: Isochrone;
    maxRadius: number;
    travelMode: "driving" | "driving-traffic" | "walking" | "cycling" | "public_transport";
    selectedPOI: POI | null;
    setSelectedPOI: (poi: POI | null) => void;
    routeGeoJSON: any;
}

// Function to create a GeoJSON polygon for the maxRadius circle
const createGeoJSONCircle = (center: [number, number], radiusInKm: number, points = 64) => {
    const coords = {
        latitude: center[1],
        longitude: center[0],
    };

    const km = radiusInKm;
    const ret = [];
    const distanceX = km / (111.320 * Math.cos((coords.latitude * Math.PI) / 180)); // Longitudinal distance
    const distanceY = km / 110.574; // Latitudinal distance

    for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI); // Angle for each point
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);

        ret.push([coords.longitude + x, coords.latitude + y]);
    }

    // Close the polygon by repeating the first point
    ret.push(ret[0]);

    return {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [ret],
                },
            },
        ],
    };
};

export default function MapBoxWebView({
                                          location,
                                          pois,
                                          isochrone,
                                          maxRadius,
                                          travelMode,
                                          selectedPOI,
                                          setSelectedPOI,
                                          routeGeoJSON,
                                      }: MapBoxWebViewProps) {
    const poiGeoJSON = {
        type: "FeatureCollection",
        features: pois.map((poi) => ({
            type: "Feature",
            properties: { title: poi.name, id: poi.id },
            geometry: {
                type: "Point",
                coordinates: [poi.longitude, poi.latitude],
            },
        })),
    };

    const maxRadiusGeoJSON = createGeoJSONCircle([location.longitude, location.latitude], maxRadius / 1000);

    const isochronePolygons = isochrone.coordinates.map((polygon) => ({
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: polygon,
        },
        properties: {},
    }));

    const isochronePolygon = `
        map.on('load', () => {
            // Add Isochrone polygons
            map.addSource('iso', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: ${JSON.stringify(isochronePolygons)},
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

            // Add max radius as a circle outline
            map.addSource('maxRadius', {
                type: 'geojson',
                data: ${JSON.stringify(maxRadiusGeoJSON)},
            });

            map.addLayer({
                id: 'maxRadiusLayer',
                type: 'line',
                source: 'maxRadius',
                layout: {},
                paint: {
                    'line-color': 'rgba(255, 0, 0, 0.8)',
                    'line-width': 2,
                },
            });

            // Add user location as a dot
            map.addSource('userLocation', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [${location.longitude}, ${location.latitude}],
                    },
                }
            });

            map.addLayer({
                id: 'userLocationLayer',
                type: 'circle',
                source: 'userLocation',
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#0000ff',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                }
            });

            // Add POI Clustering
            map.addSource('pois', {
                type: 'geojson',
                data: ${JSON.stringify(poiGeoJSON)},
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50,
            });

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

            // Handle POI click
            map.on('click', 'unclustered-point', (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const { title, id } = e.features[0].properties;

                // Notify parent about the selected POI
                window.ReactNativeWebView.postMessage(
                    JSON.stringify({ type: 'SELECT_POI', data: { id, title, coordinates } })
                );

                // Show a popup on click
                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(\`<strong>\${title}</strong>\`)
                    .addTo(map);
            });

            // Add route if available
            ${routeGeoJSON
        ? `
                map.addSource('route', {
                    type: 'geojson',
                    data: ${JSON.stringify(routeGeoJSON)},
                });

                map.addLayer({
                    id: 'routeLayer',
                    type: 'line',
                    source: 'route',
                    layout: {},
                    paint: {
                        'line-color': '#ff00ff',
                        'line-width': 4,
                    },
                });
            `
        : ''}
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
            <WebView
                originWhitelist={["*"]}
                source={{ html }}
                style={styles.map}
                onMessage={(event) => {
                    const message = JSON.parse(event.nativeEvent.data);
                    if (message.type === "SELECT_POI") {
                        const { id, title, coordinates } = message.data;
                        setSelectedPOI({ id, name: title, latitude: coordinates[1], longitude: coordinates[0] });
                    }
                }}
            />
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
