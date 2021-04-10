
import messaging from '@react-native-firebase/messaging';
import Toast from 'react-native-toast-message';
import {saveNotificationToken} from './lib/notification';

const validNotificationTypes = new Map([
    ['device_state', 'Device State Event'],
    ['motion_event', 'Motion Event']
]);


async function onTokenRefresh(state, token) {
    const results = await Promise.all(state.accountList.map(async ([id, {serverUuid, address, port}]) => {
        const url = 'https://' + address + (port ? ':' + port : '');

        try {
            return await saveNotificationToken(url, id, serverUuid, token);
        } catch (err) {
            return {success: false, message: err.message};
        }

    }));

    const failed = results.filter(({success}) => !success);

    if (failed.length > 0) {
        Toast.show({
            type: 'error',
            text1: 'Notification System',
            text2: failed.length + ' account could not update notification token'
        });
    }
}

function showInAppNotification(message, onShowCamera) {
    const {data: {eventType, deviceId, deviceName}} = message;

    if (!isValidNotificationType(eventType)) {
        Toast.show({
            type: 'info',
            text1: eventType,
        });
        return;
    }

    Toast.show({
        type: 'info',
        text1: validNotificationTypes.get(eventType),
        text2: deviceName,
        onPress: () => onShowCamera(deviceId)
    });
}

export function isValidNotificationType(type) {
    return validNotificationTypes.has(type);
}

export function handleNotification(state, onShowCamera) {

    const messageHandlerCleanup = messaging().onMessage(async message => {
        if (state.activeAccount && message.data.serverId === state.activeAccount.serverUuid) {
            showInAppNotification(message, onShowCamera);
        }
    });

    const tokenHandlerCleanup = messaging().onTokenRefresh(async token => onTokenRefresh(state, token));

    return () => {
        messageHandlerCleanup();
        tokenHandlerCleanup();
    };
}