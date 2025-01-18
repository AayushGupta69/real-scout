import {Account, Avatars, Client, OAuthProvider} from "react-native-appwrite";
import * as Linking from 'expo-linking';
import {openAuthSessionAsync} from "expo-web-browser";

export const config = {
    platform: "com.aayushgupta.real-scout",
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
}

export const client = new Client();

client
    .setEndpoint(config.endpoint!)
    .setProject(config.projectId!)
    .setPlatform(config.platform!)

export const avatar = new Avatars(client);
export const account = new Account(client);

export async function login() {
    try {
        const redirectUri = Linking.createURL('/');
        const response = await account.createOAuth2Token(OAuthProvider.Google, redirectUri);

        if(!response) throw new Error('Failed to login. No response from server');

        const browserResult = await openAuthSessionAsync(response.toString(), redirectUri);

        if(browserResult.type !== 'success') throw new Error('Failed to login. Browser result was not success');

        const url = new URL(browserResult.url);
        const secret = url.searchParams.get('secret')?.toString();
        const userId = url.searchParams.get('userId')?.toString();

        if(!secret || !userId) throw new Error('Failed to login. No secret or userId found in url');

        const session = await account.createSession(userId, secret);

        if(!session) throw new Error('Failed to create a session');

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function logout() {
    try {
        await account.deleteSession('current');
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function getCurrentUser() {
    try {
        const response = await account.get();

        if(response.$id){
            const userAvatar = avatar.getInitials(response.name);
            return {
                ...response,
                avatar: userAvatar.toString(),
            };
        }
    } catch (e) {
        console.error(e);
        return null;
    }
}
