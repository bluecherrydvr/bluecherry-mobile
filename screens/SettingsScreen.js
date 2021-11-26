import React, {useState, useContext, createContext} from 'react';
import {useTheme} from '@react-navigation/native';
import {Button, StyleSheet, Text, View, KeyboardAvoidingView, Platform} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import Toast from 'react-native-toast-message';
import {createStackNavigator} from '@react-navigation/stack';

import SessionContext from '../session-context';
import {setAccountInfo} from '../lib/storage';
import ToggleNavigationButton from '../components/ToggleNavigationButton';

const settingContext = createContext({
  onSubmit: () => {},
  dateFormat: '',
  onChangeDateFormat: () => {},
});

function AdvancedInfoView() {
  const {onChangeDateFormat, dateFormat, onSubmit} = useContext(settingContext);

  const {colors} = useTheme();
  const styles = StyleSheet.create({
    formRow: {
      flexDirection: 'row',
      marginBottom: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputStyle: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.text,
    },
  });

  const dateFormatList = [
    {
      value: 'M-D-YY h:m:s A',
      label: 'M-D-YY h:m:s A',
    },
    {
      value: 'MM-DD-YYYY hh:mm:ss A',
      label: 'MM-DD-YYYY hh:mm:ss A',
    },
    {
      value: 'DD-MM-YYYY hh:mm:ss A',
      label: 'DD-MM-YYYY hh:mm:ss A',
    },
  ];
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1, alignItems: 'stretch'}}>
      <View style={{padding: 10}}>
        <View style={styles.formRow}>
          <Text style={{flex: 1, color: colors.text, textAlignVertical: 'center'}}>Choose Date Format:</Text>
          <RNPickerSelect
            items={dateFormatList}
            placeholder={{
              label: 'Select a Date format',
              value: null,
              color: '#9EA0A4',
            }}
            style={{
              viewContainer: {
                flex: 1,
                height: 40,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.text,
                justifyContent: 'center',
              },
              inputAndroid: {
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.text,
                alignContent: 'center',
                textAlignVertical: 'center',
              },
              inputIOS: {
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.text,
                alignContent: 'center',
                textAlignVertical: 'center',
              },
            }}
            value={dateFormat}
            onValueChange={(value) => {
              onChangeDateFormat(value);
            }}
          />
        </View>
        <View style={{paddingRight: 0}}>
          <Button title="Save" onPress={() => onSubmit()} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function SettingsScreen({route: {params}, navigation}) {
  const {updateAccountList, state, dispatch} = useContext(SessionContext);
  const {activeAccount} = state;
  const {address, port, login, password, rtspAddress, rtspPort, name} = activeAccount;

  const {dateFormat: prevDateFormat = 'M-D-YY h:m:s A'} = activeAccount ?? {};
  const Stack = createStackNavigator();
  const [dateFormat, onChangeDateFormat] = useState(prevDateFormat);
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

  const onSubmit = async () => {
    try {
      await saveAccountInfo(state.activeAccount.id, state.activeAccount.serverUuid);
      await updateAccountList();
      await dispatch({
        type: 'login',
        payload: {
          id: state.activeAccount.id,
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
      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: 'Settings saved successfully',
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
    onSubmit,
    dateFormat,
    onChangeDateFormat,
  };

  return (
    <settingContext.Provider value={contextValue}>
      <Stack.Navigator>
        <Stack.Screen
          name="SettingsScreen"
          options={{
            title: 'Settings',
            headerLeft: () => (
              <View style={{paddingLeft: 15}}>
                <ToggleNavigationButton />
              </View>
            ),
          }}
          component={AdvancedInfoView}
        />
      </Stack.Navigator>
    </settingContext.Provider>
  );
}
