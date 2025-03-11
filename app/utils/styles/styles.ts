import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
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
        maxHeight: "75%",
        width: "100%",
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
    instructionItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        paddingRight: 10,
    },
    instructionIndex: {
        fontWeight: "bold",
        marginRight: 5,
    },
    instructionText: {
        fontSize: 16,
        flexShrink: 1,
    },
    modalCard: {
        height: "80%",
        width: "85%",
        maxWidth: 400,
    },
    cardActions: {
        alignSelf: "flex-end",
        padding: 25,
        flexDirection: "row",
        justifyContent: "flex-end",
        width: "100%",
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    title: {
        flex: 0.8,
    },
    typeIcon: {
        flex: 0.2,
        width: 30,
        height: 30,
        resizeMode: "contain",
    },
    addressContainer: {
        marginVertical: 20,
    },
    addressText: {
        fontWeight: "bold",
    },
    iconContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 30,
    },
    contactIcon: {
        width: 30,
        height: 30,
        marginHorizontal: 50,
    },
    openingHoursContainer: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 5,
        padding: 10,
        marginVertical: 10,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    starsContainer: {
        flexDirection: "row",
        marginRight: 5,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
});

export default styles;
