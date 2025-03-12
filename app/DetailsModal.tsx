import React from "react";
import { View, ScrollView, Image, Linking, TouchableOpacity } from "react-native";
import { Modal, Portal, Button, ActivityIndicator, Card, Title, Paragraph } from "react-native-paper";
import styles from "@/app/utils/styles/styles";
import { POI_ICONS } from "@/app/utils/poiIcons";
import { Icon } from "react-native-paper";

type DetailsModalProps = {
    isDetailsModalVisible: boolean;
    setIsDetailsModalVisible: (visible: boolean) => void;
    poiDetails: any;
    normalizeOpeningHours: (openingHours: string | string[]) => string[];
};

const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0; // Check if we need a half star
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
        <View style={styles.starsContainer}>
            {[...Array(fullStars)].map((_, i) => (
                <Icon key={`full-${i}`} source="star" size={20} color="#FFD700" />
            ))}
            {halfStar && <Icon source="star-half" size={20} color="#FFD700" />}
            {[...Array(emptyStars)].map((_, i) => (
                <Icon key={`empty-${i}`} source="star-outline" size={20} color="#FFD700" />
            ))}
        </View>
    );
};

export default function DetailsModal({
                                         isDetailsModalVisible,
                                         setIsDetailsModalVisible,
                                         poiDetails,
                                         normalizeOpeningHours,
                                     }: DetailsModalProps) {
    return (
        <Portal>
            <Modal
                visible={isDetailsModalVisible}
                onDismiss={() => setIsDetailsModalVisible(false)}
                contentContainerStyle={styles.modalContainer}
            >
                <Card style={styles.modalCard}>
                    <Card.Content style={styles.cardContent}>
                        <View style={styles.titleContainer}>
                            <Title style={styles.title}>{poiDetails?.name}</Title>
                            {poiDetails?.type && (
                                <Image
                                    source={{ uri: POI_ICONS[poiDetails.type] }}
                                    style={styles.typeIcon}
                                />
                            )}
                        </View>
                        <ScrollView style={styles.scrollView}>
                            {poiDetails ? (
                                <View>
                                    <View style={styles.addressContainer}>
                                        <Paragraph style={styles.addressText}>{poiDetails.address}</Paragraph>
                                    </View>
                                    <View style={styles.iconContainer}>
                                        {poiDetails.phone && (
                                            <TouchableOpacity onPress={() => Linking.openURL(`tel:${poiDetails.phone}`)}>
                                                <Image source={{ uri: POI_ICONS.phone_contact }} style={styles.contactIcon} />
                                            </TouchableOpacity>
                                        )}
                                        {poiDetails.website && (
                                            <TouchableOpacity onPress={() => Linking.openURL(poiDetails.website)}>
                                                <Image source={{ uri: POI_ICONS.website_contact }} style={styles.contactIcon} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <View style={styles.openingHoursContainer}>
                                        <Paragraph style={{ fontWeight: "bold" }}>Opening Hours:</Paragraph>
                                        {Array.isArray(poiDetails.openingHours) || typeof poiDetails.openingHours === 'string' ? (
                                            normalizeOpeningHours(poiDetails.openingHours).map((hours: string, index: number) => (
                                                <Paragraph key={index}>{hours}</Paragraph>
                                            ))
                                        ) : (
                                            <Paragraph>No opening hours available</Paragraph>
                                        )}
                                    </View>
                                    <View style={{ marginVertical: 20 }}>
                                        <Paragraph style={{ fontWeight: "bold" }}>Rating:</Paragraph>
                                        {poiDetails.rating ? (
                                            <View style={styles.ratingContainer}>
                                                {renderStars(poiDetails.rating)}
                                                <Paragraph style={styles.ratingText}>{poiDetails.rating.toFixed(1)}</Paragraph>
                                            </View>
                                        ) : (
                                            <Paragraph>No rating available</Paragraph>
                                        )}
                                    </View>
                                    <Paragraph style={{ fontWeight: "bold" }}>Reviews:</Paragraph>
                                    {Array.isArray(poiDetails.reviews) ? (
                                        poiDetails.reviews.map((review: string, index: number) => (
                                            <Paragraph key={index}>"{review}"</Paragraph>
                                        ))
                                    ) : (
                                        <Paragraph>No reviews available</Paragraph>
                                    )}
                                </View>
                            ) : (
                                <ActivityIndicator animating={true} />
                            )}
                        </ScrollView>
                    </Card.Content>
                    <Card.Actions style={styles.cardActions}>
                        <Button onPress={() => setIsDetailsModalVisible(false)} mode="contained">Close</Button>
                    </Card.Actions>
                </Card>
            </Modal>
        </Portal>
    );
}
