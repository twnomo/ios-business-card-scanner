import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { processImage } from '../services/gemini';
import { addContact, checkDuplicate } from '../services/db';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export default function ScannerScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const router = useRouter();

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.text}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current && !isProcessing) {
            try {
                setIsProcessing(true);
                const photo = await cameraRef.current.takePictureAsync({
                    base64: true,
                    quality: 0.5, // Simple compression
                    skipProcessing: true // Faster
                });

                if (photo?.base64) {
                    setPhotoUri(photo.uri);
                    await handleProcess(photo.base64, photo.uri);
                }
            } catch (e) {
                console.error(e);
                Alert.alert("Error", "Failed to take picture");
                setIsProcessing(false);
            }
        }
    };

    const handleProcess = async (base64: string, uri: string) => {
        try {
            const data = await processImage(base64);

            const isDuplicate = await checkDuplicate(data.name);

            if (isDuplicate) {
                Alert.alert(
                    "Duplicate Found",
                    `Contact "${data.name}" already exists. Save anyway?`,
                    [
                        {
                            text: "Cancel", style: "cancel", onPress: () => {
                                setIsProcessing(false);
                                setPhotoUri(null);
                            }
                        },
                        { text: "Save", onPress: () => saveContact(data, base64, uri) }
                    ]
                );
            } else {
                await saveContact(data, base64, uri);
            }

        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to process card. Please try again.");
            setIsProcessing(false);
            setPhotoUri(null);
        }
    };

    const saveContact = async (data: any, base64: string, uri: string) => {
        try {
            let finalBase64 = base64;

            // Perform Fixed-Mask Crop (approx matching the UI frame)
            try {
                const { width: imgW, height: imgH } = await new Promise<{ width: number, height: number }>((resolve) => {
                    Image.getSize(uri, (width, height) => resolve({ width, height }));
                });

                // Frame is roughly 80% width, centered.
                // It's calculated to be a card aspect ratio (approx 4:3 or 1.6:1) in UI.
                // We define crop relative to image size.
                const cropWidth = imgW * 0.85;
                const cropHeight = cropWidth / 1.6; // Business card aspect ratio

                const finalManip = await manipulateAsync(
                    uri,
                    [{
                        crop: {
                            originX: (imgW - cropWidth) / 2,
                            originY: (imgH - cropHeight) / 2,
                            width: cropWidth,
                            height: cropHeight,
                        }
                    }],
                    { base64: true, format: SaveFormat.JPEG }
                );
                finalBase64 = finalManip.base64 || base64;
            } catch (cropError) {
                console.warn("Fixed crop failed, saving original:", cropError);
            }

            await addContact({
                name: data.name,
                title: data.title,
                company: data.company,
                phone: data.phone,
                mobile_phone: data.mobile_phone,
                email: data.email,
                address: data.address,
                website: data.website,
                image_data: finalBase64,
                suggested_rotation: data.suggested_rotation
            });

            Alert.alert("Success", `Contact "${data.name}" saved!`);
            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to save contact");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            {photoUri && isProcessing ? (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: photoUri }} style={styles.preview} />
                    <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.processingText}>Processing Card...</Text>
                    </View>
                </View>
            ) : (
                <>
                    <CameraView ref={cameraRef} style={styles.camera}>
                        {/* Scanner Mask Overlay */}
                        <View style={styles.maskContainer}>
                            <View style={[styles.maskSide, { flex: 1 }]} />
                            <View style={{ flexDirection: 'row', height: 230 }}>
                                <View style={styles.maskSide} />
                                <View style={styles.maskFrame}>
                                    <View style={styles.cornerTL} />
                                    <View style={styles.cornerTR} />
                                    <View style={styles.cornerBL} />
                                    <View style={styles.cornerBR} />
                                </View>
                                <View style={styles.maskSide} />
                            </View>
                            <View style={[styles.maskSide, { flex: 1, alignItems: 'center', paddingTop: 20 }]}>
                                <Text style={styles.maskText}>Align Card within Frame</Text>
                            </View>
                        </View>
                    </CameraView>

                    <SafeAreaView style={styles.controls} edges={['bottom']}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                            <Ionicons name="close" size={30} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                            <View style={styles.captureButtonInner} />
                        </TouchableOpacity>

                        <View style={{ width: 44 }} />
                    </SafeAreaView>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
        color: '#fff',
    },
    camera: {
        flex: 1,
    },
    maskContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    maskSide: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    maskFrame: {
        width: '85%',
        height: 230,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        backgroundColor: 'transparent',
    },
    maskText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    cornerTL: { position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#007AFF' },
    cornerTR: { position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#007AFF' },
    cornerBL: { position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#007AFF' },
    cornerBR: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#007AFF' },
    controls: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 30,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff',
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
    },
    previewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    preview: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    processingOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
    },
    processingText: {
        color: '#fff',
        marginTop: 15,
        fontSize: 16,
        fontWeight: '600',
    },
});
