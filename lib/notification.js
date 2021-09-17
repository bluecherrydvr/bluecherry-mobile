import {getMobileConfig, storeNotificationToken, removeNotificationToken} from './api';

export async function saveNotificationToken(url, clientUuid, serverUuid, token) {
  const {notification_api_endpoint} = await getMobileConfig(url);
  const {success, message} = await storeNotificationToken(notification_api_endpoint, clientUuid, serverUuid, token);

  if (!success) {
    throw new Error(message);
  }
}

export async function unsaveNotificationToken(url, clientUuid, serverUuid) {
  const {notification_api_endpoint} = await getMobileConfig(url);
  const {success, message} = await removeNotificationToken(notification_api_endpoint, clientUuid, serverUuid);

  if (!success) {
    throw new Error(message);
  }
}
