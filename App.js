/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */


import 'react-native-gesture-handler';
import SplashScreen from 'react-native-splash-screen';

import React, {useEffect, useState} from 'react';

import {NavigationContainer, DarkTheme, useTheme} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator} from '@react-navigation/drawer';

import Orientation from 'react-native-orientation-locker';
import Toast from 'react-native-toast-message';

import styles from './stylesheet';

import ConnectServerScreen from './screens/ConnectServerScreen';
import ServerSettingsScreen from './screens/ServerSettingsScreen';

import SessionContext from './session-context';
import CameraScreen from './screens/CameraScreen';
import EventScreen from './screens/EventScreen';
import DrawerMenu from './menu';
import {Button, View, Alert, Text} from 'react-native';

import { MenuProvider } from 'react-native-popup-menu';

import {
    getAccountInfoList,
    getActiveAccountInfoByList,
    removeAccountInfo
} from './lib/storage';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

import {checkServerCredentials} from './lib/api';

function ServerRemoveButton({id, name, navigation, updateAccountList}) {
    return (<Button title="Remove" color="red" onPress={() => Alert.alert(
        'Server Removal Confirmation',
        'Are you sure to remove "' + name + '" server?',
        [
            { text: 'Cancel', style: 'cancel'},
            { text: 'Confirm', style: 'destructive',
                onPress: async() => {
                    await removeAccountInfo(id);
                    await updateAccountList();
                    navigation.goBack();
                }
            }
        ],
        {cancelable: true})} />);
}

const App: () => React$Node = () => {
    const [loggedInAccountId, setLoginAccountId] = useState(null);
    const [accountList, setAccountList] = useState([]);

    const updateAccountList = async() => {
        const list = await getAccountInfoList();
        setAccountList(list);
        return list;
    };

    useEffect(() => {

        if (!loggedInAccountId) {
            Orientation.lockToPortrait();
            // SplashScreen.show();
        }

        updateAccountList().then(async (accountList) => {

            if (loggedInAccountId) {
                // SplashScreen.hide();
                return;
            }

            const activeAccount = await getActiveAccountInfoByList(accountList);

            if (activeAccount) {
                const [id, accountRecord] = activeAccount;
                const {address, login, password} = accountRecord;

                try {
                    // start session with previous active session
                    const status = await checkServerCredentials('https://' + address, login, password);
                    if (status) {
                        setLoginAccountId({id, ...accountRecord});
                        return;
                    }
                } catch (err) {
                    Toast.show({
                        type: 'error',
                        text1: 'Login Error',
                        text2: err.message
                    })
                }
            }

            // SplashScreen.hide();
        });
    }, [loggedInAccountId]);

    return (
        <SessionContext.Provider value={{loggedInAccountId, setLoginAccountId, accountList, updateAccountList}}>
            <MenuProvider>
            <NavigationContainer theme={DarkTheme}>
                {loggedInAccountId ? (
                    <Drawer.Navigator drawerContent={(props) => <DrawerMenu {...props} />}>
                        <Drawer.Screen name="Camera" component={CameraScreen} listeners={{
                            focus: () => Orientation.lockToLandscape(),
                            blur: () => Orientation.lockToPortrait()
                        }} />
                        <Drawer.Screen name="Event" component={EventScreen} />
                    </Drawer.Navigator>
                ) : (
                    <Stack.Navigator>
                        <Stack.Screen name="Home" component={ConnectServerScreen} options={{headerShown: false}} />
                        <Stack.Screen name="ServerSettings" component={ServerSettingsScreen}
                                      options={({route, navigation}) =>
                                          (route.params?.id ? {title:  'Edit Server',
                                                  headerRight: () => <ServerRemoveButton {...route.params} navigation={navigation}
                                                                                         updateAccountList={updateAccountList} />}
                                              : {title: 'Add Server'})} />
                    </Stack.Navigator>
                )}
            </NavigationContainer>
            <Toast ref={(ref) => Toast.setRef(ref)} />
            </MenuProvider>
        </SessionContext.Provider>
    );
};



export default App;
