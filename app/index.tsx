import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { Contact, getContacts } from '../services/db';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ContactsScreen() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [search, setSearch] = useState('');
    const router = useRouter();

    const loadContacts = async () => {
        try {
            const data = await getContacts();
            setContacts(data);
        } catch (e) {
            console.error("Failed to load contacts", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadContacts();
        }, [])
    );

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }: { item: Contact }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/${item.id}`)}
        >
            {item.image_data ? (
                <Image source={{ uri: `data:image/jpeg;base64,${item.image_data}` }} style={styles.cardImage} />
            ) : (
                <View style={[styles.cardImage, styles.placeholderImage]}>
                    <Ionicons name="person" size={24} color="#ccc" />
                </View>
            )}
            <View style={styles.cardContent}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.company}>{item.company}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <FlatList
                data={filteredContacts}
                keyExtractor={item => item.id?.toString() || Math.random().toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search contacts..."
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No business cards yet.</Text>
                        <Text style={styles.emptySubtext}>Tap the + button to scan one.</Text>
                    </View>
                }
                ListFooterComponent={
                    <View style={styles.footer}>
                        <Text style={styles.versionText}>Version 1.0.6</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/scanner')}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    list: {
        padding: 16,
        paddingTop: 0,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#eee',
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderImage: {
        backgroundColor: '#f0f0f0',
    },
    cardContent: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    title: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    company: {
        fontSize: 14,
        color: '#888',
        marginTop: 2,
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 32,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        fontWeight: '500',
    },
    emptySubtext: {
        fontSize: 16,
        color: '#999',
        marginTop: 8,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    versionText: {
        fontSize: 12,
        color: '#ccc',
    },
});
