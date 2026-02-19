export const getAlignmentClass = (alignment: "left" | "center" | "right"): string => {
    switch (alignment) {
        case "left":
            return "ttly-align-left";
        case "right":
            return "ttly-align-right";
        default:
            return "ttly-align-center";
    }
};
