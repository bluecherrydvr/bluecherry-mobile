
import AsyncStorage from '@react-native-async-storage/async-storage';
import {v4 as uuidv4} from 'uuid';

export async function getAccountInfo(accountId) {
    const accountInfo = await AsyncStorage.getItem('account_' + accountId);
    return accountInfo ? JSON.parse(accountInfo) : null;
}

export async function getAccountIds() {
    const ids = await AsyncStorage.getItem('account_ids');
    return !ids ? [] : JSON.parse(ids);
}

export async function setAccountInfo(accountId, accountInfo) {
    const ids = await getAccountIds();

    const setAccountId = () => AsyncStorage.setItem('account_' + accountId,
        JSON.stringify(accountInfo));

    if (ids.includes(accountId)) {
        return setAccountId();
    }

    return Promise.all([
        AsyncStorage.setItem('account_ids', JSON.stringify(ids.concat(accountId))),
        setAccountId()
    ]);
}

export async function removeAccountInfo(accountId) {

    const ids = await getAccountIds();
    const targetIndex = ids.indexOf(accountId);

    // account id not in list
    if (targetIndex === -1) {
        return false;
    }

    // remove target id from list
    ids.splice(targetIndex, 1);

    return Promise.all([
        AsyncStorage.setItem('account_ids', JSON.stringify(ids)),
        AsyncStorage.removeItem('account_' + accountId)
    ]);
}

export async function getAccountInfoList() {
    return Promise.all((await getAccountIds())
        .map(async id => [id, await getAccountInfo(id)]));
}

export async function getFreshAccountId(maxRetry = 10) {

    if (maxRetry === 0) {
        throw new Error('reached max retry count');
    }

    const accountId = uuidv4();

    // check and retry if accountId collide previous one
    if (await getAccountInfo(accountId)) {
        return getFreshAccountId(maxRetry - 1);
    }

    return accountId;
}

export async function setActiveAccount(accountId) {
    return AsyncStorage.setItem('active_account', accountId);
}

export async function getActiveAccount() {
    return AsyncStorage.getItem('active_account');
}

export async function unsetActiveAccount() {
     const accountId = await getActiveAccount();
     if (!accountId) {
         return false;
     }

     await AsyncStorage.removeItem('active_account');

     return accountId;
}

export async function getActiveAccountInfoByList(accountList) {
    const activeAccount = await getActiveAccount();

    if (!activeAccount) {
        return;
    }

    for (const info of accountList) {
        if (activeAccount === info[0]) {
            return info;
        }
    }
}

export async function getSelectedCameraList(accountId) {
    const list = await AsyncStorage.getItem('selected_cameras_' + accountId);

    if (!list) {
        return [
            [null], [null, null], [null, null, null, null]
        ];
    }

    return JSON.parse(list);
}

export async function setSelectedCamera(accountId, type, index, cameraId = null, list = null) {
    if (!list) {
        list = await getSelectedCameraList(accountId)
    }
    list[type][index] = cameraId;
    await AsyncStorage.setItem('selected_cameras_' + accountId, JSON.stringify(list));
    return list;
}