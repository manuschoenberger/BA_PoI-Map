import {Isochrone} from "@/app/utils/apiServices";
import {multiPolygon} from "@turf/helpers";
import bbox from "@turf/bbox";

export const calculateIsochroneBounds = (iso: Isochrone) => {
    const isoMultiPolygon = multiPolygon(iso.coordinates);
    return bbox(isoMultiPolygon);
};
