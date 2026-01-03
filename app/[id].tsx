import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, Modal, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Contact, getContacts, deleteContact, updateContact } from '../services/db';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

export default function DetailsScreen() {
    const { id } = useLocalSearchParams();
    const [contact, setContact] = useState<Contact | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContact, setEditedContact] = useState<Contact | null>(null);
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);
    const [manualRotation, setManualRotation] = useState(0);
    const router = useRouter();

    useEffect(() => {
        if (contact) {
            setManualRotation(contact.suggested_rotation || 0);
        }
    }, [contact]);

    useEffect(() => {
        loadContact();
    }, [id]);

    const loadContact = async () => {
        try {
            const all = await getContacts();
            const found = all.find(c => c.id?.toString() === id);
            if (found) {
                setContact(found);
                setEditedContact(found);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        if (!editedContact) return;
        try {
            await updateContact(editedContact);
            setContact(editedContact);
            setIsEditing(false);
            Alert.alert("Success", "Contact updated successfully");
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to update contact");
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Contact",
            "Are you sure you want to delete this contact?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (contact.id) {
                                await deleteContact(contact.id);
                                router.back();
                            }
                        } catch (e) {
                            Alert.alert("Error", "Failed to delete contact");
                        }
                    }
                }
            ]
        );
    };

    if (!contact) {
        return (
            <View style={styles.center}>
                <Text>Loading details...</Text>
            </View>
        );
    }

    const handlePressDetail = (label: string, value: string) => {
        let url = '';
        switch (label.toLowerCase()) {
            case 'phone':
                url = `tel:${value}`;
                break;
            case 'email':
                url = `mailto:${value}`;
                break;
            case 'address':
                url = `http://maps.apple.com/?q=${encodeURIComponent(value)}`;
                break;
            case 'website':
                url = value.startsWith('http') ? value : `https://${value}`;
                break;
        }

        if (url) {
            Linking.openURL(url).catch(() => {
                Alert.alert("Error", `Cannot open ${label.toLowerCase()} link`);
            });
        }
    };

    const DetailItem = ({ icon, label, value, field }: { icon: string, label: string, value: string, field: keyof Contact }) => {
        if (!isEditing && !value) return null;

        return (
            <TouchableOpacity
                style={styles.detailRow}
                onPress={() => !isEditing && handlePressDetail(label, value)}
                disabled={isEditing}
            >
                <Ionicons name={icon as any} size={20} color="#007AFF" style={styles.icon} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.label}>{label}</Text>
                    {isEditing ? (
                        <TextInput
                            style={styles.input}
                            value={String(editedContact?.[field] || '')}
                            onChangeText={(text) => setEditedContact(prev => prev ? { ...prev, [field]: text } : null)}
                            placeholder={`Enter ${label.toLowerCase()}`}
                            placeholderTextColor="#ccc"
                        />
                    ) : (
                        <Text style={styles.value}>{value}</Text>
                    )}
                </View>
                {!isEditing && <Ionicons name="chevron-forward" size={16} color="#ccc" />}
            </TouchableOpacity>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen
                options={{
                    title: isEditing ? 'Edit Contact' : contact.name,
                    headerRight: () => (
                        <View style={{ flexDirection: 'row' }}>
                            {isEditing ? (
                                <TouchableOpacity onPress={handleSave} style={{ marginRight: 15 }}>
                                    <Ionicons name="checkmark" size={24} color="#007AFF" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity onPress={() => setIsEditing(true)} style={{ marginRight: 15 }}>
                                    <Ionicons name="create-outline" size={24} color="#007AFF" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={handleDelete}>
                                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    ),
                }}
            />

            {contact.image_data ? (
                <>
                    <TouchableOpacity
                        style={styles.imageWrapper}
                        onPress={() => setIsImageModalVisible(true)}
                        activeOpacity={0.9}
                    >
                        <Image
                            source={{ uri: `data:image/jpeg;base64,${contact.image_data}` }}
                            style={[
                                styles.image,
                                { transform: [{ rotate: `${contact.suggested_rotation || 0}deg` }] }
                            ]}
                            resizeMode="contain"
                        />
                        <View style={styles.zoomHint}>
                            <Ionicons name="search-outline" size={20} color="white" />
                            <Text style={styles.zoomText}>Tap to Zoom</Text>
                        </View>
                    </TouchableOpacity>

                    <Modal
                        visible={isImageModalVisible}
                        transparent={false}
                        animationType="slide"
                        onRequestClose={() => setIsImageModalVisible(false)}
                    >
                        <View style={[styles.modalBackground, { backgroundColor: '#000' }]}>
                            <View style={{ flex: 1, width: '100%', justifyContent: 'center' }}>
                                <ScrollView
                                    contentContainerStyle={styles.zoomScrollContent}
                                    maximumZoomScale={5}
                                    minimumZoomScale={1}
                                    showsHorizontalScrollIndicator={false}
                                    showsVerticalScrollIndicator={false}
                                >
                                    <Image
                                        source={{ uri: `data:image/jpeg;base64,${contact.image_data}` }}
                                        style={[
                                            styles.fullImage,
                                            { transform: [{ rotate: `${manualRotation}deg` }] }
                                        ]}
                                        resizeMode="contain"
                                    />
                                </ScrollView>
                            </View>

                            {/* Bottom Footer Controls */}
                            <SafeAreaView style={styles.modalFooter} edges={['bottom']}>
                                <TouchableOpacity
                                    style={styles.footerButton}
                                    onPress={() => setManualRotation((prev) => (prev + 90) % 360)}
                                >
                                    <Ionicons name="refresh-circle" size={50} color="#007AFF" />
                                    <Text style={styles.footerButtonText}>Rotate</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.footerButton}
                                    onPress={async () => {
                                        const hasChanged = manualRotation !== (contact.suggested_rotation || 0);
                                        if (hasChanged) {
                                            Alert.alert(
                                                "Save Rotation?",
                                                "Would you like to save this new orientation for the business card?",
                                                [
                                                    {
                                                        text: "No",
                                                        style: "cancel",
                                                        onPress: () => setIsImageModalVisible(false)
                                                    },
                                                    {
                                                        text: "Save",
                                                        onPress: async () => {
                                                            try {
                                                                const updated = { ...contact, suggested_rotation: manualRotation };
                                                                await updateContact(updated);
                                                                setContact(updated);
                                                                setIsImageModalVisible(false);
                                                            } catch (e) {
                                                                Alert.alert("Error", "Failed to save rotation");
                                                            }
                                                        }
                                                    }
                                                ]
                                            );
                                        } else {
                                            setIsImageModalVisible(false);
                                        }
                                    }}
                                >
                                    <Ionicons name="close-circle" size={50} color="#fff" />
                                    <Text style={styles.footerButtonText}>Close</Text>
                                </TouchableOpacity>
                            </SafeAreaView>

                        </View>
                    </Modal>
                </>
            ) : (
                <View style={styles.placeholderContainer}>
                    <Ionicons name="business" size={80} color="#ccc" />
                </View>
            )}

            <View style={styles.infoSection}>
                {isEditing ? (
                    <View>
                        <TextInput
                            style={[styles.input, styles.mainName, { borderBottomWidth: 1, borderBottomColor: '#eee' }]}
                            value={editedContact?.name}
                            onChangeText={(t) => setEditedContact(p => p ? { ...p, name: t } : null)}
                            placeholder="Name"
                        />
                        <TextInput
                            style={[styles.input, styles.mainTitle, { borderBottomWidth: 1, borderBottomColor: '#eee' }]}
                            value={editedContact?.title}
                            onChangeText={(t) => setEditedContact(p => p ? { ...p, title: t } : null)}
                            placeholder="Title"
                        />
                        <TextInput
                            style={[styles.input, styles.mainCompany, { borderBottomWidth: 1, borderBottomColor: '#eee' }]}
                            value={editedContact?.company}
                            onChangeText={(t) => setEditedContact(p => p ? { ...p, company: t } : null)}
                            placeholder="Company"
                        />
                    </View>
                ) : (
                    <>
                        <Text style={styles.mainName}>{contact.name}</Text>
                        <Text style={styles.mainTitle}>{contact.title}</Text>
                        <Text style={styles.mainCompany}>{contact.company}</Text>
                    </>
                )}

                <View style={styles.divider} />

                <DetailItem icon="phone-portrait-outline" label="Mobile" value={contact.mobile_phone} field="mobile_phone" />
                <DetailItem icon="call-outline" label="Phone" value={contact.phone} field="phone" />
                <DetailItem icon="mail-outline" label="Email" value={contact.email} field="email" />
                <DetailItem icon="location-outline" label="Address" value={contact.address} field="address" />
                <DetailItem icon="globe-outline" label="Website" value={contact.website} field="website" />

                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Ionicons name="trash" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.deleteButtonText}>Delete Contact</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageWrapper: {
        backgroundColor: '#000',
        width: '100%',
        height: 300,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '90%',
        height: '90%',
    },
    placeholderContainer: {
        width: '100%',
        height: 200,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoSection: {
        padding: 24,
    },
    mainName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    mainTitle: {
        fontSize: 18,
        color: '#666',
        marginTop: 4,
    },
    mainCompany: {
        fontSize: 18,
        color: '#444',
        fontWeight: '500',
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    icon: {
        width: 30,
        marginRight: 12,
    },
    label: {
        fontSize: 12,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    value: {
        fontSize: 16,
        color: '#333',
        marginTop: 2,
    },
    input: {
        fontSize: 16,
        color: '#007AFF',
        marginTop: 2,
        paddingVertical: 4,
    },
    deleteButton: {
        flexDirection: 'row',
        backgroundColor: '#FF3B30',
        padding: 16,
        borderRadius: 12,
        marginTop: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    zoomHint: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    zoomText: {
        color: 'white',
        fontSize: 12,
        marginLeft: 4,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalFooter: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 20,
        backgroundColor: 'rgba(20,20,20,0.9)',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    footerButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerButtonText: {
        color: 'white',
        fontSize: 14,
        marginTop: 2,
        fontWeight: 'bold',
    },
    fullImage: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height * 0.65,
    },
    zoomScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomFooter: {
        position: 'absolute',
        bottom: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    zoomFooterText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
});
