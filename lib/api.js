import Toast from 'react-native-toast-message';

import {parse} from 'fast-xml-parser';
import {getAddressByCredentials} from './util';

const rgIdMatch = /id=(\d+)/;

function stripIdUrl(target) {
  if (!target) {
    return;
  }

  const match = rgIdMatch.exec(target);
  return match ? match[1] : null;
}

export async function checkServerCredentials(url, login, password, successMessage = 'Connection Successful') {
  const formData = new FormData();

  formData.append('login', login);
  formData.append('password', password);

  try {
    const target = new URL('ajax/loginapp.php', url);
    const result = await fetch(target, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const {success, server_uuid, message} = await result.json();
    console.log('success: ', success);
    console.log('server_uuid: ', server_uuid);
    console.log('message: ', message);
    if (success) {
      Toast.show({
        type: 'success',
        text1: successMessage,
      });

      return server_uuid;
    } else {
      Toast.show({
        type: 'error',
        text1: 'Auth Error',
        text2: message,
      });
    }
  } catch (err) {
    Toast.show({
      type: 'error',
      text1: 'Connection Error',
      text2: err.message,
    });
  }

  return false;
}

export async function getDevices(url) {
  const target = new URL('devices.php?XML=1', url);

  const result = await fetch(target, {
    credentials: 'include',
    redirect: 'error',
  });

  const document = parse(await result.text());

  if (!document.devices || !document.devices.device) {
    throw new Error('API response has different XML data');
  }

  return document.devices.device;
}

export async function getAvailableDevices(loggedInAccountId) {
  const devices = await getDevices(getAddressByCredentials(loggedInAccountId));
  const available = devices.filter(({status}) => status === 'OK');
  return available.map(({id, device_name}) => ({id, device_name}));
}

export async function getEvents(url, limit = 50) {
  const target = new URL('events/?limit=' + limit, url);

  const result = await fetch(target, {
    credentials: 'include',
    redirect: 'error',
  });

  const document = parse(await result.text());
  console.log('Data=======>', document);
  if (!document.feed || !document.feed.entry) {
    throw new Error('API response has different XML data');
  }

  return [
    document.feed.entry.map((item) => {
      const {id, content} = item;
      return {...item, id: stripIdUrl(id), content: stripIdUrl(content)};
    }),
    document.feed.updated,
  ];
}

export async function getMobileConfig(url) {
  const target = new URL('mobile-app-config.json', url);

  const result = await fetch(target, {
    credentials: 'include',
    redirect: 'error',
  });

  return result.json();
}

export async function storeNotificationToken(url, clientUuid, serverUuid, token) {
  const target = new URL('store-token', url);

  const result = await fetch(target, {
    method: 'POST',
    credentials: 'include',
    redirect: 'error',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientUuid,
      server_id: serverUuid,
      token: token,
    }),
  });

  return result.json();
}

export async function removeNotificationToken(url, clientUuid, serverUuid) {
  const target = new URL('remove-token', url);

  const result = await fetch(target, {
    method: 'POST',
    credentials: 'include',
    redirect: 'error',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientUuid,
      server_id: serverUuid,
    }),
  });

  return result.json();
}
