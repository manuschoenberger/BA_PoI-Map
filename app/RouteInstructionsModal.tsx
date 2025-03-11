import React from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import styles from "@/app/utils/styles/styles";

interface RouteInstructionsModalProps {
    isVisible: boolean;
    onClose: () => void;
    summary: string | null;
}

export default function RouteInstructionsModal({
                                              isVisible,
                                              onClose,
                                              summary,
                                     }: RouteInstructionsModalProps ) {
    const instructions = summary ? summary.split(", ").filter(instruction => instruction.trim() !== "") : [];

    return (
        <Modal visible={isVisible} transparent={true} animationType="slide">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Route Instructions</Text>
                    <ScrollView style={styles.scrollView}>
                        {instructions.map((instruction, index) => (
                            <View key={index} style={styles.instructionItem}>
                                <Text style={styles.instructionIndex}>{index + 1}.</Text>
                                <Text style={styles.instructionText}>{instruction}</Text>
                            </View>
                        ))}
                    </ScrollView>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
