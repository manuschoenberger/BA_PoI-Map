export const getColorByMode = (mode: string): string => {
    switch (mode) {
        case "driving":
        case "driving-traffic":
            return "rgba(0, 0, 255, 0.8)";
        case "walking":
        case "walk":
            return "rgba(0, 255, 0, 0.8)";
        case "cycling":
        case "bike":
            return "rgba(255, 165, 0, 0.8)";
        case "bus":
            return "rgba(255, 0, 0, 0.8)";
        case "train":
            return "rgba(255, 0, 255, 0.8)";
        default:
            return "rgba(0, 0, 0, 0.8)";
    }
};
