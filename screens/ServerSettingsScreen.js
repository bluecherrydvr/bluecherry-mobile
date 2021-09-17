import React, {useState, useContext, createContext} from 'react';

import {useTheme} from '@react-navigation/native';
import {Button, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform} from 'react-native';
import Toast from 'react-native-toast-message';
import styles from '../stylesheet';

import SessionContext from '../session-context';

import {checkServerCredentials} from '../lib/api';
import {saveNotificationToken} from '../lib/notification';
import {getFreshAccountId, setAccountInfo, setActiveAccount} from '../lib/storage';

import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import messaging from '@react-native-firebase/messaging';

const Tab = createMaterialTopTabNavigator();

const ServerConfigContext = createContext({
  id: '',
  notificationPerm: Platform.OS === 'android',
  onNotificationPerm: () => {},
  address: '',
  onChangeAddress: () => {},
  port: '',
  onChangePort: () => {},
  login: '',
  onChangeLogin: () => {},
  password: '',
  onChangePassword: () => {},
  name: '',
  onChangeName: () => {},
  rtspAddress: '',
  onChangeRtspAddress: () => {},
  rtspPort: '',
  onChangeRtspPort: () => {},
  disabled: '',
  setDisabled: () => {},
  onSubmit: () => {},
});

function BasicInfoView() {
  const {
    id,
    address,
    onChangeAddress,
    login,
    onChangeLogin,
    password,
    onChangePassword,
    name,
    onChangeName,
    disabled,
    setDisabled,
    onSubmit,
  } = useContext(ServerConfigContext);

  const {colors} = useTheme();

  const inputStyle = StyleSheet.flatten([
    styles.textInput,
    {
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.text,
    },
  ]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1, alignItems: 'stretch', justifyContent: 'center'}}>
      <View style={{padding: 10}}>
        <View style={styles.formRow}>
          <Text style={{flex: 1, color: colors.text, textAlignVertical: 'center'}}>Server Address:</Text>
          <TextInput
            style={inputStyle}
            value={address}
            disabled={disabled}
            autoCapitalize="none"
            autoCorrect={false}
            autoCompleteType="off"
            onChangeText={(address) => onChangeAddress(address)}
          />
        </View>
        <View style={styles.formRow}>
          <Text style={{flex: 1, color: colors.text, textAlignVertical: 'center'}}>Login:</Text>
          <TextInput
            style={inputStyle}
            value={login}
            disabled={disabled}
            autoCapitalize="none"
            autoCorrect={false}
            autoCompleteType="off"
            onChangeText={(login) => onChangeLogin(login)}
          />
        </View>
        <View style={styles.formRow}>
          <Text style={{flex: 1, color: colors.text, textAlignVertical: 'center'}}>Password:</Text>
          <TextInput
            style={inputStyle}
            value={password}
            disabled={disabled}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(password) => onChangePassword(password)}
          />
        </View>
        <View style={styles.formRow}>
          <Text style={{flex: 1, color: colors.text, textAlignVertical: 'center'}}>Server Name:</Text>
          <TextInput style={inputStyle} value={name} disabled={disabled} onChangeText={(name) => onChangeName(name)} />
        </View>
        <View style={{alignItems: 'center', marginTop: 10}}>
          <Button
            title={id ? 'Save' : 'Connect'}
            onPress={() => onSubmit(address, login, password, name, setDisabled)}
            disabled={disabled || !address || !login || !password || !name}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function AdvancedInfoView({navigation}) {
  const {
    id,
    notificationPerm,
    onNotificationPerm,
    disabled,
    address,
    onChangeAddress,
    port,
    onChangePort,
    rtspAddress,
    onChangeRtspAddress,
    rtspPort,
    onChangeRtspPort,
  } = useContext(ServerConfigContext);

  const {colors} = useTheme();
  const inputStyle = StyleSheet.flatten([
    styles.textInput,
    {
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.text,
    },
  ]);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1, alignItems: 'stretch', justifyContent: 'center'}}>
      <View style={{padding: 10}}>
        <View style={styles.formRow}>
          <Text style={{flex: 1, color: colors.text, textAlignVertical: 'center'}}>Server Address:</Text>
          <TextInput
            style={inputStyle}
            value={address}
            disabled={disabled}
            autoCorrect={false}
            autoCompleteType="off"
            onChangeText={(address) => onChangeAddress(address)}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.formRow}>
          <Text style={{flex: 1, color: colors.text, textAlignVertical: 'center'}}>Server Port:</Text>
          <TextInput
            style={inputStyle}
            value={port}
            disabled={disabled}
            keyboardType="numeric"
            autoCorrect={false}
            autoCompleteType="off"
            onChangeText={(port) => onChangePort(port)}
          />
        </View>
        <View style={styles.formRow}>
          <Text style={{flex: 1, color: colors.text, textAlignVertical: 'center'}}>RTSP Server Address:</Text>
          <TextInput
            style={inputStyle}
            value={rtspAddress}
            disabled={disabled}
            defaultValue={address}
            autoCorrect={false}
            autoCompleteType="off"
            onChangeText={(rtspAddress) => onChangeRtspAddress(rtspAddress)}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.formRow}>
          <Text style={{flex: 1, color: colors.text, textAlignVertical: 'center'}}>RTSP Server Port:</Text>
          <TextInput
            style={inputStyle}
            value={rtspPort}
            disabled={disabled}
            keyboardType="numeric"
            autoCorrect={false}
            autoCompleteType="off"
            onChangeText={(rtspPort) => onChangeRtspPort(rtspPort)}
          />
        </View>

        <View style={{alignItems: 'center', marginTop: 10}}>
          <Button title="Complete" onPress={() => navigation.navigate('Basic')} disabled={!address} />
          {id && !notificationPerm ? (
            <Button
              title="Allow Notification"
              onPress={() => requestNotificationPerm().then((perm) => onNotificationPerm(perm))}
            />
          ) : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

async function requestNotificationPerm() {
  if (Platform.OS === 'android') {
    return true;
  }

  const authStatus = await messaging().requestPermission();

  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL
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
    rtspPort: prevRtspPort = '7002',
    dateFormat: prevDateFormat = 'M-D-YY h:m:s A',
    notificationPerm: prevNotificationPerm = Platform.OS === 'android',
  } = params ?? {};

  const [dateFormat] = useState(prevDateFormat);
  const [address, onChangeAddress] = useState(prevAddress);
  const [port, onChangePort] = useState(prevPort);
  const [login, onChangeLogin] = useState(prevLogin);
  const [password, onChangePassword] = useState(prevPassword);
  const [rtspAddress, onChangeRtspAddress] = useState(prevRtspAddress);
  const [rtspPort, onChangeRtspPort] = useState(prevRtspPort);
  const [notificationPerm, onNotificationPerm] = useState(prevNotificationPerm);

  const [name, onChangeName] = useState(prevName);

  const [disabled, setDisabled] = useState(false);

  const saveAccountInfo = (id, serverUuid, notificationPerm) =>
    setAccountInfo(id, {
      address,
      port,
      login,
      password,
      rtspAddress,
      rtspPort,
      name,
      serverUuid,
      notificationPerm,
      dateFormat,
    });

  const {dispatch, updateAccountList} = useContext(SessionContext);

  const onSubmit = async () => {
    const url = 'https://' + address + (port ? ':' + port : '');

    setDisabled(true);
    const serverUuid = await checkServerCredentials(
      url,
      login,
      password,
      id ? 'Credentials OK' : 'Connection Successful',
    );

    if (serverUuid === false) {
      setDisabled(false);
      return;
    }

    try {
      if (id) {
        await saveAccountInfo(id, serverUuid, notificationPerm);
        await updateAccountList();
        navigation.goBack();
        return;
      }

      const accountId = await getFreshAccountId();

      await Promise.all([
        saveAccountInfo(accountId, serverUuid, await requestNotificationPerm()),
        setActiveAccount(accountId),
      ]);

      try {
        const token = await messaging().getToken();
        await saveNotificationToken(url, accountId, serverUuid, token);
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Notification System',
          text2: err.message,
        });
      }

      dispatch({
        type: 'login',
        payload: {
          id: accountId,
          address,
          port,
          login,
          password,
          rtspAddress,
          rtspPort,
          name,
          dateFormat,
        },
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Storage Error',
        text2: err.message,
      });
    }
  };

  const contextValue = {
    id,
    onNotificationPerm,
    notificationPerm,
    address,
    onChangeAddress,
    port,
    onChangePort,
    login,
    onChangeLogin,
    password,
    onChangePassword,
    rtspAddress,
    onChangeRtspAddress,
    rtspPort,
    onChangeRtspPort,
    name,
    onChangeName,
    disabled,
    setDisabled,
    onSubmit,
    dateFormat,
  };

  return (
    <ServerConfigContext.Provider value={contextValue}>
      <Tab.Navigator>
        <Tab.Screen name="Basic" component={BasicInfoView} />
        <Tab.Screen name="Advanced" component={AdvancedInfoView} />
      </Tab.Navigator>
    </ServerConfigContext.Provider>
  );
}
