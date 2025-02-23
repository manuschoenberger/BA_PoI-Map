import React from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, Modal } from "react-native";
import indexStyles from "@/app/utils/styles/indexStyles";

type DetailsModalProps = {
    isDetailsModalVisible: boolean;
    setIsDetailsModalVisible: (visible: boolean) => void;
    poiDetails: any;
    normalizeOpeningHours: (openingHours: string | string[]) => string[];
};

export default function DetailsModal({
                                         isDetailsModalVisible,
                                         setIsDetailsModalVisible,
                                         poiDetails,
                                         normalizeOpeningHours,
                                     }: DetailsModalProps ) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isDetailsModalVisible}
            onRequestClose={() => setIsDetailsModalVisible(false)}
        >
            <View style={indexStyles.modalContainer}>
                <View style={indexStyles.modalContent}>
                    <Text style={indexStyles.modalTitle}>{poiDetails?.name}</Text>
                    <ScrollView style={indexStyles.scrollView}>
                        {poiDetails ? (
                            <View>
                                <Text style={indexStyles.detailText}>Type: {poiDetails.type}</Text>
                                <Text style={indexStyles.detailText}>Address: {poiDetails.address}</Text>
                                <Text style={indexStyles.detailText}>Phone: {poiDetails.phone}</Text>
                                <Text style={indexStyles.detailText}>Website: {poiDetails.website}</Text>
                                <Text style={indexStyles.detailText}>Opening Hours:</Text>
                                {Array.isArray(poiDetails.openingHours) || typeof poiDetails.openingHours === 'string' ? (
                                    normalizeOpeningHours(poiDetails.openingHours).map((hours: string, index: number) => (
                                        <Text key={index} style={indexStyles.openingHoursText}>{hours}</Text>
                                    ))
                                ) : (
                                    <Text style={indexStyles.detailText}>No opening hours available</Text>
                                )}
                                <Text style={indexStyles.detailText}>Rating: {poiDetails.rating}</Text>
                                <Text style={indexStyles.detailText}>Reviews:</Text>
                                {Array.isArray(poiDetails.reviews) ? (
                                    poiDetails.reviews.map((review: string, index: number) => (
                                        <Text key={index} style={indexStyles.reviewText}>"{review}"</Text>
                                    ))
                                ) : (
                                    <Text style={indexStyles.detailText}>No reviews available</Text>
                                )}
                            </View>
                        ) : (
                            <ActivityIndicator size="large" color="#0000ff" />
                        )}
                    </ScrollView>
                    <Pressable onPress={() => setIsDetailsModalVisible(false)} style={indexStyles.closeButton}>
                        <Text style={indexStyles.closeButtonText}>Close</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};
