import React from "react";
import { ScrollView } from "react-native";
import { Modal, Portal, Card, Button, Text } from "react-native-paper";
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
                                               }: RouteInstructionsModalProps) {
    const instructions = summary ? summary.split(", ").filter(instruction => instruction.trim() !== "") : [];

    return (
        <Portal>
            <Modal visible={isVisible} onDismiss={onClose} contentContainerStyle={styles.modalContainer}>
                <Card style={styles.modalCard}>
                    <Card.Content style={styles.cardContent}>
                        <Card.Title title="Route Instructions" titleStyle={styles.modalTitle} />
                        <ScrollView style={styles.scrollView}>
                            {instructions.map((instruction, index) => (
                                <Text key={index} style={styles.instructionItem}>
                                    <Text style={styles.instructionIndex}>{index + 1}. </Text>
                                    <Text style={styles.instructionText}>{instruction}</Text>
                                </Text>
                            ))}
                        </ScrollView>
                    </Card.Content>
                    <Card.Actions style={styles.cardActions}>
                        <Button onPress={onClose} mode="contained">Close</Button>
                    </Card.Actions>
                </Card>
            </Modal>
        </Portal>
    );
}
