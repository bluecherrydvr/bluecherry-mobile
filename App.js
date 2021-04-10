/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */


import 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';

import messaging from '@react-native-firebase/messaging';

import React, {useEffect, useReducer, useRef, useCallback, useState} from 'react';

import {NavigationContainer, DarkTheme, useTheme} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator} from '@react-navigation/drawer';

import Orientation from 'react-native-orientation-locker';
import Toast from 'react-native-toast-message';

import styles from './stylesheet';

import ConnectServerScreen from './screens/ConnectServerScreen';
import ServerSettingsScreen from './screens/ServerSettingsScreen';

import SessionContext from './session-context';
import {CameraScreen, DirectCameraScreen} from './screens/CameraScreen';
import EventScreen from './screens/EventScreen';
import DrawerMenu from './menu';
import {Button, View, Alert, Text} from 'react-native';

import { MenuProvider } from 'react-native-popup-menu';

import {
    getAccountInfoList,
    getActiveAccountInfoByList,
    getTargetAccountByServerId,
    removeAccountInfo,
    getSelectedCameraList
} from './lib/storage';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

import {checkServerCredentials, getAvailableDevices} from './lib/api';
import {unsaveNotificationToken} from './lib/notification';
import {handleNotification, isValidNotificationType} from './notification';

import {initialState, reducer} from './state';

function ServerRemoveButton({id, name, serverUuid, address, port, navigation, updateAccountList}) {
    return (<Button title="Remove" color="red" onPress={() => Alert.alert(
        'Server Removal Confirmation',
        'Are you sure to remove "' + name + '" server?',
        [
            { text: 'Cancel', style: 'cancel'},
            { text: 'Confirm', style: 'destructive',
                onPress: async() => {

                    const url = 'https://' + address + (port ? ':' + port : '');

                    try {
                        await unsaveNotificationToken(url, id, serverUuid);
                    } catch (err) {
                        Toast.show({
                            type: 'error',
                            text1: 'Notification System',
                            text2: err.message
                        });
                    }

                    await removeAccountInfo(id);

                    await updateAccountList();
                    navigation.goBack();
                }
            }
        ],
        {cancelable: true})} />);
}


const App: () => React$Node = () => {

    const navRef = useRef(null);
    const [state, dispatch] = useReducer(reducer, initialState);
    const [notification, setNotification] = useState(null);

    const updateAccountList = async() => {
        const list = await getAccountInfoList();
        dispatch({type: 'update_account_list', payload: list});
        return list;
    };

    const loginTargetAccount = useCallback((targetAccount, targetDevice) => {

        if (!targetAccount) {
            SplashScreen.hide();
            return;
        }

        const [id, accountRecord] = targetAccount;
        const {address, login, password} = accountRecord;

        checkServerCredentials('https://' + address, login, password).then(status => {
            if (status !== false) {
                dispatch({
                    type: 'login',
                    payload: {id, ...accountRecord},
                    targetDevice
                });
            }
        });
    }, []);

    const navigateTargetDevice = useCallback((deviceList, targetDevice) => {

        if (!targetDevice) {
            SplashScreen.hide();
            return;
        }

        SplashScreen.show();

        let params = {};

        if (deviceList.find(({id}) => parseInt(id) === parseInt(targetDevice))) {
            params = {
                screen: 'DeviceDirectPlay',
                params: {
                    deviceId: targetDevice
                }
            };
        }

        navRef.current?.navigate('DirectCamera', params);

    }, []);

    const onShowCamera = useCallback((deviceId) => {

        SplashScreen.show();

        navRef.current?.navigate('DirectCamera', {
            screen: 'DeviceDirectPlay',
            params: {
                deviceId: deviceId
            }
        });
    }, []);


    useEffect(() => {
        SplashScreen.show();

        const msg = messaging();
        msg.onNotificationOpenedApp((message) => setNotification(message));
        msg.setBackgroundMessageHandler(async message => {});
    }, []);


    useEffect(() => {

        if (!notification) {
            return;
        }

        const {serverId, deviceId, eventType} = notification.data;

        if (state.activeAccount && state.activeAccount.serverUuid === serverId) {
            if (isValidNotificationType(eventType)) {
                navigateTargetDevice(state.deviceList, deviceId);
            }
            return;
        }

        dispatch({type: 'logout'});

        getTargetAccountByServerId(state.accountList, serverId).then(targetAccount => {

            if (!targetAccount) {
                return;
            }

            loginTargetAccount(targetAccount, isValidNotificationType(eventType) ? deviceId : null);
        });

    }, [notification]);


    useEffect(() => {

        if (!state.activeAccount) {
            Orientation.lockToPortrait();
        }

        updateAccountList().then(async (accountList) => {

            if (!state.activeAccount) {

                const initialNotification = await messaging().getInitialNotification();
                if (initialNotification) {
                    const {serverId, deviceId, eventType} = initialNotification.data;
                    loginTargetAccount(await getTargetAccountByServerId(accountList, serverId),
                        isValidNotificationType(eventType) ? deviceId : null);
                } else {
                    loginTargetAccount(await getActiveAccountInfoByList(accountList));
                }
                return;
            }

            Promise.all([
                getAvailableDevices(state.activeAccount),
                getSelectedCameraList(state.activeAccount.id)
            ]).then(([deviceList, selectedDeviceList]) => {
                dispatch({type: 'update_all_device_list', deviceList, selectedDeviceList});

                navigateTargetDevice(deviceList, state.targetDevice);

            });

        });

        return handleNotification(state, onShowCamera);

    }, [state.activeAccount]);

    return (
        <SessionContext.Provider value={{state, dispatch, updateAccountList}}>
            <MenuProvider>
            <NavigationContainer ref={navRef} theme={DarkTheme}>
                {state.activeAccount ? (
                    <Drawer.Navigator drawerContent={(props) => <DrawerMenu {...props} />}>
                        <Drawer.Screen name="Camera" options={{title: 'Screens'}} component={CameraScreen} listeners={{
                            focus: () => {SplashScreen.hide(); Orientation.lockToLandscape()}
                        }} />
                        <Drawer.Screen name="DirectCamera" component={DirectCameraScreen} options={{title: 'Direct Camera'}} listeners={{
                            focus: () => {SplashScreen.hide(); Orientation.lockToLandscape()}
                        }} />
                        <Drawer.Screen name="Event" component={EventScreen} listeners={{
                            focus: () => {SplashScreen.hide(); Orientation.lockToLandscape()}
                        }} />
                    </Drawer.Navigator>
                ) : (
                    <Stack.Navigator>
                        <Stack.Screen name="Home" component={ConnectServerScreen} options={{headerShown: false}} listeners={{
                            focus: () => Orientation.lockToPortrait()
                        }} />
                        <Stack.Screen name="ServerSettings" component={ServerSettingsScreen}
                                      options={({route, navigation}) =>
                                          (route.params?.id ? {title:  'Edit Server',
                                                  headerRight: () => <ServerRemoveButton {...route.params} navigation={navigation}
                                                                                         updateAccountList={updateAccountList} />}
                                              : {title: 'Add Server'})} listeners={{
                            focus: () => Orientation.lockToPortrait()
                        }} />
                    </Stack.Navigator>
                )}
            </NavigationContainer>
            <Toast ref={(ref) => Toast.setRef(ref)} />
            </MenuProvider>
        </SessionContext.Provider>
    );
};



export default App;
