import React, { useRef, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { LocationObjectCoords } from "expo-location";
import { POI, Isochrone } from "./utils/apiServices";
import { getColorByMode } from "@/app/utils/routeColorUtils";
import { createGeoJSONCircle } from "@/app/utils/maxRadiusCircleUtils";
import { getDistanceFromLatLonInKm } from "@/app/utils/distanceUtils";
import { calculateIsochroneBounds } from "@/app/utils/isochroneBoundsUtils";
import { POI_ICONS } from "@/app/utils/poiIcons";

const apiKey = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;

interface MapBoxWebViewProps {
    location: LocationObjectCoords;
    pois: POI[];
    isochrone: Isochrone;
    maxRadius: number;
    selectedPOI: POI | null;
    setSelectedPOI: (poi: POI | null) => void;
    routeGeoJSON: { parts: { mode: string; coords: { lat: number; lng: number }[] }[] } | null;
    isDataFetched: boolean;
}

export default function MapBoxWebView({
                                          location,
                                          pois,
                                          isochrone,
                                          maxRadius,
                                          setSelectedPOI,
                                          routeGeoJSON,
                                          isDataFetched,
                                      }: MapBoxWebViewProps) {
    const webViewRef = useRef<WebView>(null);
    const routePartsRef = useRef<{ id: string; color: string; data: any }[]>([]);

    const poiGeoJSON = {
        type: "FeatureCollection",
        features: pois.map((poi) => ({
            type: "Feature",
            properties: {
                title: poi.name,
                id: poi.id,
                icon: poi.type && poi.type in POI_ICONS ? poi.type : "default" // Assign icon based on POI type
            },
            geometry: {
                type: "Point",
                coordinates: [poi.longitude, poi.latitude],
            },
        })),
    };

    const maxRadiusGeoJSON = createGeoJSONCircle([location.longitude, location.latitude], maxRadius / 1000);

    const { inBoundsSegments, outOfBoundsSegments } = isochrone.coordinates.reduce(
        (
            acc: { inBoundsSegments: [number, number][][]; outOfBoundsSegments: [number, number][][] },
            polygon
        ) => {
            let currentSegment: [number, number][] = [];
            let isOutOfBounds = false;

            polygon[0].forEach(([lng, lat], index) => {
                const distance = getDistanceFromLatLonInKm(location.latitude, location.longitude, lat, lng);
                const point: [number, number] = [lng, lat];
                const outOfBounds = distance > maxRadius / 1000; // Convert maxRadius to km

                if (outOfBounds !== isOutOfBounds) {
                    if (currentSegment.length > 0) {
                        if (isOutOfBounds) {
                            acc.outOfBoundsSegments.push(currentSegment);
                        } else {
                            acc.inBoundsSegments.push(currentSegment);
                        }
                        currentSegment = [point];
                    }
                    isOutOfBounds = outOfBounds;
                } else {
                    currentSegment.push(point);
                }

                // Handle the last point
                if (index === polygon[0].length - 1 && currentSegment.length > 0) {
                    if (isOutOfBounds) {
                        acc.outOfBoundsSegments.push(currentSegment);
                    } else {
                        acc.inBoundsSegments.push(currentSegment);
                    }
                }
            });

            return acc;
        },
        { inBoundsSegments: [], outOfBoundsSegments: [] }
    );

    const isochroneGeoJSON = {
        type: "FeatureCollection",
        features: isochrone.coordinates.map((polygon) => ({
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: polygon,
            },
            properties: {},
        })),
    };

    // Map transport modes to Mapbox Maki icons
    const transportModeIcons: Record<string, string> = {
        walk: "pitch",
        bus: "bus",
        train: "rail",
        cycling: "bicycle",
        driving: "car",
    };

    // Extract start points of each section for mode icons
    const modeIconsGeoJSON = {
        type: "FeatureCollection",
        features: routeGeoJSON
            ? routeGeoJSON.parts.map((part) => ({
                type: "Feature",
                properties: { icon: transportModeIcons[part.mode] || "marker" },
                geometry: {
                    type: "Point",
                    coordinates: [
                        part.coords[0].lng,
                        part.coords[0].lat,
                    ],
                },
            }))
            : [],
    };

    // Inject JavaScript to update the map dynamically
    const updateMap = () => {
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
            if (map.getSource('isoFill')) {
                map.getSource('isoFill').setData(${JSON.stringify(isochroneGeoJSON)});
            }
            if (map.getSource('maxRadius')) {
                map.getSource('maxRadius').setData(${JSON.stringify(maxRadiusGeoJSON)});
            }
            if (map.getSource('pois')) {
                map.getSource('pois').setData(${JSON.stringify(poiGeoJSON)});
            }

            ${routePartsRef.current
                .map(
                    (part) => `
                        if (map.getSource('${part.id}')) {
                            map.getSource('${part.id}').setData(${JSON.stringify(part.data)});
                        } else {
                            map.addSource('${part.id}', {
                                type: 'geojson',
                                data: ${JSON.stringify(part.data)}
                            });
                            map.addLayer({
                                id: '${part.id}',
                                type: 'line',
                                source: '${part.id}',
                                layout: {},
                                paint: {
                                    'line-color': '${part.color}',
                                    'line-width': 4
                                }
                            });
                        }
                    `
                )
                .join("")}

            // Remove existing mode icons layer if needed
            if (map.getLayer('modeIconsLayer')) {
                map.removeLayer('modeIconsLayer');
            }
            if (map.getSource('modeIcons')) {
                map.getSource('modeIcons').setData(${JSON.stringify(modeIconsGeoJSON)});
            } else {
                map.addSource('modeIcons', {
                    type: 'geojson',
                    data: ${JSON.stringify(modeIconsGeoJSON)}
                });
            }

            map.addLayer({
                id: 'modeIconsLayer',
                type: 'symbol',
                source: 'modeIcons',
                layout: {
                    'icon-image': ['get', 'icon'],
                    'icon-size': 1.2,
                    'icon-anchor': 'center'
                }
            });
        `);
        }
    };

    // Function to remove the route and mode icons from the map
    const removeRoute = () => {
        if (webViewRef.current && routePartsRef.current.length > 0) {
            webViewRef.current.injectJavaScript(`
            ${routePartsRef.current
                .map(
                    (part) => `
                        if (map.getLayer('${part.id}')) {
                            map.removeLayer('${part.id}');
                        }
                        if (map.getSource('${part.id}')) {
                            map.removeSource('${part.id}');
                        }
                    `
                )
                .join("")}
            if (map.getLayer('modeIconsLayer')) {
                map.removeLayer('modeIconsLayer');
            }
            if (map.getSource('modeIcons')) {
                map.removeSource('modeIcons');
            }
        `);
        }
    };

    // Update map when data changes
    useEffect(() => {
        if (isDataFetched && isochrone.coordinates.length > 0) {
            const bounds = calculateIsochroneBounds(isochrone);
            const fitBoundsScript = `
                if (typeof map !== 'undefined' && map.isStyleLoaded()) {
                    map.fitBounds([[${bounds[0]}, ${bounds[1]}], [${bounds[2]}, ${bounds[3]}]], {
                        padding: { top: 50, right: 50, bottom: 50, left: 50 },
                        animate: true
                    });
                }
            `;
            setTimeout(() => {
                webViewRef.current?.injectJavaScript(fitBoundsScript);
            }, 500); // Small delay ensures the map is ready
        }

        if (routeGeoJSON) {
            routePartsRef.current = routeGeoJSON.parts.map((part, index) => ({
                id: `route-part-${index}`,
                color: getColorByMode(part.mode),
                data: {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: part.coords.map((coord) => [coord.lng, coord.lat]),
                    },
                },
            }));
            updateMap();
        } else {
            removeRoute();
        }
    }, [isochrone, routeGeoJSON, pois, isDataFetched]);

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
            
            const poiIcons = ${JSON.stringify(POI_ICONS)};

            map.on('load', () => {
                map.addSource('isoFill', {
                    type: 'geojson',
                    data: ${JSON.stringify(isochroneGeoJSON)}
                });

                map.addLayer({
                    id: 'isoFillLayer',
                    type: 'fill',
                    source: 'isoFill',
                    layout: {},
                    paint: {
                        'fill-color': 'rgba(0, 150, 255, 0.3)',
                        'fill-opacity': 0.5,
                    }
                });

                // Add Isochrone in-bounds segments
                map.addSource('isoInBounds', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: ${JSON.stringify(inBoundsSegments.map(segment => ({
                            type: 'Feature',
                            geometry: {
                                type: 'LineString',
                                coordinates: segment,
                            },
                            properties: {},
                        })))},
                    }
                });

                map.addLayer({
                    id: 'isoInBoundsLayer',
                    type: 'line',
                    source: 'isoInBounds',
                    layout: {},
                    paint: {
                        'line-color': '#007cbf',
                        'line-width': 2,
                    }
                });

                // Add Isochrone out-of-bounds segments
                map.addSource('isoOutOfBounds', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: ${JSON.stringify(outOfBoundsSegments.map(segment => ({
                            type: 'Feature',
                            geometry: {
                                type: 'LineString',
                                coordinates: segment,
                            },
                            properties: {},
                        })))},
                    }
                });

                map.addLayer({
                    id: 'isoOutOfBoundsLayer',
                    type: 'line',
                    source: 'isoOutOfBounds',
                    layout: {},
                    paint: {
                        'line-color': 'rgba(255, 0, 0, 0.8)',
                        'line-width': 2,
                    }
                });

                // Max radius circle
                map.addSource('maxRadius', {
                    type: 'geojson',
                    data: ${JSON.stringify(maxRadiusGeoJSON)}
                });

                map.addLayer({
                    id: 'maxRadiusLayer',
                    type: 'line',
                    source: 'maxRadius',
                    layout: {},
                    paint: {
                        'line-color': 'rgba(255, 0, 0, 0.3)',
                        'line-width': 2,
                    }
                });
                
                Object.entries(poiIcons).forEach(([type, dataUrl]) => {
                    map.loadImage(dataUrl, (error, image) => {
                        if (!error && !map.hasImage(type)) {
                            map.addImage(type, image);
                        }
                    });
                });

                // POIs with clustering
                map.addSource('pois', {
                    type: 'geojson',
                    data: ${JSON.stringify(poiGeoJSON)},
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 50,
                });

                map.addLayer({
                    id: 'poisLayer',
                    type: 'symbol',
                    source: 'pois',
                    filter: ['!', ['has', 'point_count']],
                    layout: {
                        'icon-image': ['get', 'icon'],
                        'icon-size': 1,
                        'icon-anchor': 'bottom'
                    }
                });

                // Cluster layer
                map.addLayer({
                    id: 'clusters',
                    type: 'circle',
                    source: 'pois',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': [
                            'step',
                            ['get', 'point_count'],
                            '#51bbd6',
                            100,
                            '#f1f075',
                            750,
                            '#f28cb1'
                        ],
                        'circle-radius': [
                            'step',
                            ['get', 'point_count'],
                            20,
                            100,
                            30,
                            750,
                            40
                        ]
                    }
                });

                // Cluster count layer
                map.addLayer({
                    id: 'cluster-count',
                    type: 'symbol',
                    source: 'pois',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': '{point_count_abbreviated}',
                        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                        'text-size': 12
                    }
                });

                // User location
                map.addSource('userLocation', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [${location.longitude}, ${location.latitude}],
                        }
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

                // POI click handler
                map.on('click', 'poisLayer', (e) => {
                    const coordinates = e.features[0].geometry.coordinates.slice();
                    const { title, id } = e.features[0].properties;

                    window.ReactNativeWebView.postMessage(
                        JSON.stringify({ type: 'SELECT_POI', data: { id, title, coordinates } })
                    );

                    new mapboxgl.Popup({ offset: 25, anchor: 'bottom' })
                        .setLngLat(coordinates)
                        .setHTML(\`<strong>\${title}</strong>\`)
                        .addTo(map);
                });
            });
        </script>
    </body>
    </html>
    `;

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                originWhitelist={["*"]}
                source={{ html }}
                style={styles.map}
                onMessage={(event) => {
                    const message = JSON.parse(event.nativeEvent.data);
                    if (message.type === "SELECT_POI") {
                        setSelectedPOI(pois.find((poi) => poi.id === message.data.id) || null);
                    }
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
});
