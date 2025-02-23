import { StyleSheet } from "react-native";

const indexStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    menuBar: {
        backgroundColor: "#007aff",
        height: 50,
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    menuButton: {
        color: "white",
        fontSize: 18,
    },
    pickerContainer: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 5,
        marginVertical: 10,
        backgroundColor: "#fff",
    },
    picker: {
        width: "100%",
        height: 60,
    },
    pickerItem: {
        height: 50,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: 300,
        maxHeight: "80%",
        backgroundColor: "white",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    radioOption: {
        fontSize: 16,
        marginVertical: 8,
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: "#007aff",
        borderRadius: 5,
        alignItems: "center",
    },
    closeButtonText: {
        color: "white",
        fontSize: 16,
    },
    buttonContainer: {
        position: "absolute",
        bottom: 40,
        left: 20,
        right: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scrollView: {
        maxHeight: "70%",
    },
    detailText: {
        fontSize: 14,
        marginVertical: 8,
    },
    openingHoursText: {
        fontSize: 14,
    },
    reviewText: {
        fontSize: 14,
        marginVertical: 8,
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    section: {
        width: "100%",
        padding: 10,
        marginVertical: 10,
        backgroundColor: "#f9f9f9",
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    detailsButton: {
        width: 60,
        height: 60,
        backgroundColor: "#51bbd6",
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
    },
    detailsButtonText: {
        color: "white",
        fontSize: 16,
    },
    icon: {
        width: 30,
        height: 30,
    },
});

export default indexStyles;
