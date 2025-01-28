export const createGeoJSONCircle = (center: [number, number], radiusInKm: number, points = 64) => {
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
