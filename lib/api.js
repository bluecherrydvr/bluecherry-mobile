
import Toast from 'react-native-toast-message';

import {parse} from 'fast-xml-parser';

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
    formData.append('from_client', 'true');

    try {
        const target = new URL('ajax/login.php', url);
        const result = await fetch(target, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const message = await result.text();

        if (message === 'OK') {
            Toast.show({
                type: 'success',
                text1: successMessage
            });

            return true;
        } else {
            Toast.show({
                type: 'error',
                text1: 'Auth Error',
                text2: message
            });
        }

    } catch (err) {
        Toast.show({
            type: 'error',
            text1: 'Connection Error',
            text2: err.message
        });
    }

    return false;
}

export async function getDevices(url) {
    const target = new URL('devices.php?XML=1', url);

    const result = await fetch(target, {
        credentials: 'include',
        redirect: 'error'
    });

    const document = parse(await result.text());

    if (!document.devices || !document.devices.device) {
        throw new Error('API response has different XML data');
    }

    return document.devices.device;
}
export async function getEvents(url, limit = 50) {
    const target = new URL('events/?limit=' + limit, url);

    const result = await fetch(target, {
        credentials: 'include',
        redirect: 'error'
    });

    const document = parse(await result.text());

    if (!document.feed || !document.feed.entry) {
        throw new Error('API response has different XML data');
    }

    return [document.feed.entry.map((item) => {
        const {id, content} = item;
        return {...item, id: stripIdUrl(id), content: stripIdUrl(content)};
    }), document.feed.updated];
}