import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ToggleNavigationButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() => navigation.toggleDrawer()}
      style={{backgroundColor: '#333333', borderColor: '#777777', borderStyle: 'solid', borderWidth: 1, padding: 5}}>
      <Icon name="menu" size={20} color="#ffffff" />
    </TouchableOpacity>
  );
}
