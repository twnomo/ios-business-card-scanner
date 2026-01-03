import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDB } from '../services/db';
import { StatusBar } from 'expo-status-bar';

export default function Layout() {
    useEffect(() => {
        initDB();
    }, []);

    return (
        <>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#ffffff',
                    },
                    headerTintColor: '#000000',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                <Stack.Screen
                    name="index"
                    options={{
                        title: 'Business Cards',
                        headerLargeTitle: false, // Standard title to avoid overlap
                    }}
                />
                <Stack.Screen
                    name="scanner"
                    options={{
                        headerShown: false,
                        presentation: 'fullScreenModal',
                    }}
                />
                <Stack.Screen
                    name="[id]"
                    options={{
                        title: 'Contact Details',
                    }}
                />
            </Stack>
        </>
    );
}
