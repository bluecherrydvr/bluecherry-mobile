
import {TouchableOpacity, View} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import React from "react";

export default function PlayerError({onPress}) {
    return (<View style={{flex: 1}}>
        <TouchableOpacity style={{flex:1, alignItems: 'center',
            justifyContent: 'center', backgroundColor: 'red'}} onPress={onPress}>
            <Icon name="broken-image" size={90} color="#ffffff" />
        </TouchableOpacity>
    </View>);
}
