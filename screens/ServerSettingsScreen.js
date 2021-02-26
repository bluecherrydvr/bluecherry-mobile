
import React, {useState, useContext, createContext} from 'react';

import {useTheme} from '@react-navigation/native';
import {Button, StyleSheet, Text, TextInput, View} from 'react-native';
import Toast from 'react-native-toast-message';
import styles from '../stylesheet';

import SessionContext from '../session-context';

import {checkServerCredentials} from '../lib/api';
import {getFreshAccountId, setAccountInfo, setActiveAccount} from '../lib/storage';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

const ServerConfigContext = createContext({
    id: '',
    address: '', onChangeAddress: () => {},
    port: '', onChangePort: () => {},
    login: '', onChangeLogin: () => {},
    password: '', onChangePassword: () => {},
    name: '', onChangeName: () => {},
    rtspAddress: '', onChangeRtspAddress: () => {},
    rtspPort: '', onChangeRtspPort: () => {},
    disabled: '', setDisabled: () => {},
    onSubmit: () => {}
});

function BasicInfoView() {

    const {
        id,
        address, onChangeAddress,
        login, onChangeLogin,
        password, onChangePassword,
        name, onChangeName,
        disabled, setDisabled,
        onSubmit
    } = useContext(ServerConfigContext);

    const {colors} = useTheme();

    const inputStyle = StyleSheet.flatten([styles.textInput, {
        borderColor: colors.border,
        backgroundColor: colors.background,
        color: colors.text}]);

    return (
        <View style={{ flex: 1, alignItems: 'stretch', justifyContent: 'center' }}>
            <View style={{padding: 10}}>
                <View style={styles.formRow}>
                    <Text style={{flex:1, color: colors.text, textAlignVertical: 'center'}}>Server Address:</Text>
                    <TextInput style={inputStyle}
                               onChangeText={address => onChangeAddress(address)} value={address} disabled={disabled} />
                </View>
                <View style={styles.formRow}>
                    <Text style={{flex:1, color: colors.text, textAlignVertical: 'center'}}>Login:</Text>
                    <TextInput style={inputStyle}
                               onChangeText={login => onChangeLogin(login)} value={login} disabled={disabled} />
                </View>
                <View style={styles.formRow}>
                    <Text style={{flex:1, color: colors.text, textAlignVertical: 'center'}}>Password:</Text>
                    <TextInput style={inputStyle}
                               onChangeText={password => onChangePassword(password)} value={password} disabled={disabled} />
                </View>
                <View style={styles.formRow}>
                    <Text style={{flex:1, color: colors.text, textAlignVertical: 'center'}}>Server Name:</Text>
                    <TextInput style={inputStyle}
                               onChangeText={name => onChangeName(name)} value={name} disabled={disabled} />
                </View>
                <View style={{alignItems: 'center', marginTop: 10}}>
                    <Button title={id ? 'Save' : 'Connect'} onPress={() => onSubmit(address, login, password, name, setDisabled)}
                            disabled={disabled || !address || !login || !password || !name} />
                </View>
            </View>
        </View>
    );
}

function AdvancedInfoView() {

    const {
        disabled,
        address, onChangeAddress,
        port, onChangePort,
        rtspAddress, onChangeRtspAddress,
        rtspPort, onChangeRtspPort,
    } = useContext(ServerConfigContext);

    const {colors} = useTheme();

    const inputStyle = StyleSheet.flatten([styles.textInput, {
        borderColor: colors.border,
        backgroundColor: colors.background,
        color: colors.text}]);

    return (
        <View style={{ flex: 1, alignItems: 'stretch', justifyContent: 'center' }}>
            <View style={{padding: 10}}>
                <View style={styles.formRow}>
                    <Text style={{flex:1, color: colors.text, textAlignVertical: 'center'}}>Server Address:</Text>
                    <TextInput style={inputStyle}
                               onChangeText={address => onChangeAddress(address)} value={address} disabled={disabled} />
                </View>
                <View style={styles.formRow}>
                    <Text style={{flex:1, color: colors.text, textAlignVertical: 'center'}}>Server Port:</Text>
                    <TextInput style={inputStyle} value={port} disabled={disabled} keyboardType="numeric"
                               onChangeText={port => onChangePort(port)} />
                </View>
                <View style={styles.formRow}>
                    <Text style={{flex:1, color: colors.text, textAlignVertical: 'center'}}>RTSP Server Address:</Text>
                    <TextInput style={inputStyle} value={rtspAddress} disabled={disabled} defaultValue={address}
                               onChangeText={rtspAddress => onChangeRtspAddress(rtspAddress)} />
                </View>
                <View style={styles.formRow}>
                    <Text style={{flex:1, color: colors.text, textAlignVertical: 'center'}}>RTSP Server Port:</Text>
                    <TextInput style={inputStyle} value={rtspPort} disabled={disabled} keyboardType="numeric"
                               onChangeText={rtspPort => onChangeRtspPort(rtspPort)}/>
                </View>
            </View>
        </View>
    );
}

export default function ServerSettingsScreen({route: {params}, navigation}) {

    const {
        id,
        address: prevAddress = '',
        login: prevLogin = 'admin',
        password: prevPassword = 'bluecherry',
        name: prevName,
        port: prevPort = '7001',
        rtspAddress: prevRtspAddress,
        rtspPort: prevRtspPort = '7002'
    } = params ?? {};



    const [address, onChangeAddress] = useState(prevAddress);
    const [port, onChangePort] = useState(prevPort)
    const [login, onChangeLogin] = useState(prevLogin);
    const [password, onChangePassword] = useState(prevPassword);
    const [rtspAddress, onChangeRtspAddress] = useState(prevRtspAddress);
    const [rtspPort, onChangeRtspPort] = useState(prevRtspPort);

    const [name, onChangeName] = useState(prevName);


    const [disabled, setDisabled] = useState(false);

    const saveAccountInfo = (id) => setAccountInfo(id, {
        address, port,
        login, password,
        rtspAddress, rtspPort,
        name
    });

    const {setLoginAccountId, updateAccountList} = useContext(SessionContext);

    const onSubmit = async () => {

        const url = 'https://' + address + (port ? ':' + port : '');

        setDisabled(true);
        const status = await checkServerCredentials(url, login, password,
            id ? 'Credentials OK' : 'Connection Successful');

        if (!status) {
            setDisabled(false);
            return;
        }

        try {
            if (id) {
                await saveAccountInfo(id);
                await updateAccountList();
                navigation.goBack();
                return;
            }

            const accountId = await getFreshAccountId();
            await Promise.all([
                saveAccountInfo(accountId),
                setActiveAccount(accountId)
            ]);

            setLoginAccountId({
                id: accountId,
                address, port, login, password, rtspAddress, rtspPort, name
            });
        } catch (err) {
            Toast.show({
                type: 'error',
                text1: 'Storage Error',
                text2: err.message
            })
        }
    };


    const contextValue = {
        id,
        address, onChangeAddress,
        port, onChangePort,
        login, onChangeLogin,
        password, onChangePassword,
        rtspAddress, onChangeRtspAddress,
        rtspPort, onChangeRtspPort,
        name, onChangeName,
        disabled, setDisabled,
        onSubmit};

    return ( <ServerConfigContext.Provider value={contextValue}>
        <Tab.Navigator>
            <Tab.Screen name="Basic" component={BasicInfoView} />
            <Tab.Screen name="Advanced" component={AdvancedInfoView} />
        </Tab.Navigator>
    </ServerConfigContext.Provider>);
}
