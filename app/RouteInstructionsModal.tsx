import React from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import indexStyles from "@/app/utils/styles/indexStyles";

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
            <View style={indexStyles.modalContainer}>
                <View style={indexStyles.modalContent}>
                    <Text style={indexStyles.modalTitle}>Route Instructions</Text>
                    <ScrollView style={indexStyles.scrollView}>
                        {instructions.map((instruction, index) => (
                            <View key={index} style={indexStyles.instructionItem}>
                                <Text style={indexStyles.instructionIndex}>{index + 1}.</Text>
                                <Text style={indexStyles.instructionText}>{instruction}</Text>
                            </View>
                        ))}
                    </ScrollView>
                    <Pressable onPress={onClose} style={indexStyles.closeButton}>
                        <Text style={indexStyles.closeButtonText}>Close</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
