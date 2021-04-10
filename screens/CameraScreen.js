
import React, {useEffect, useState, useCallback, useContext} from 'react';
import {View, Text, TouchableOpacity, FlatList, ActivityIndicator} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SplashScreen from 'react-native-splash-screen';

import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';

import {setSelectedCamera} from '../lib/storage';

import { VLCPlayer } from 'react-native-vlc-media-player';

import { createStackNavigator } from '@react-navigation/stack';

import SessionContext from '../session-context';

import {getRtspAddressByCredentials} from '../lib/util';

const Stack = createStackNavigator();

function PlayerError({onPress}) {
    return (<View style={{flex: 1}}>
        <TouchableOpacity style={{flex:1, alignItems: 'center',
            justifyContent: 'center', backgroundColor: 'red'}} onPress={onPress}>
            <Icon name="broken-image" size={90} color="#ffffff" />
        </TouchableOpacity>
    </View>);
}

function Player({uri}) {
    const [error, setError] = useState(false);

    if (error) {
        return <PlayerError onPress={() => setError(false)} />;
    }

    return (<VLCPlayer
        source={{
            initType: 2,
            hwDecoderEnabled: 1,
            hwDecoderForced: 1,
            uri,
            initOptions: [
                '--no-audio',
                '--rtsp-tcp',
                '--network-caching=150',
                '--rtsp-caching=150',
                '--no-stats',
                '--tcp-caching=150',
                '--realrtsp-caching=150',
            ],
        }}
        autoplay={true}
        autoAspectRatio={true}
        resizeMode="contain"
        isLive={true}
        autoReloadLive={true}
        onError={() => setError(true)}
        style={{flex: 1}}
    />);
}

function SinglePlayerSection({type = 0, index = 0, onChange, onRemove, screenDevices, rtspUrl}) {

    const device = screenDevices[type][index];

    if (device) {
        return (<View style={{flex: 1}}>
            <Player uri={rtspUrl + '/live/' + device.id} />
            <Menu style={{backgroundColor: '#333333', position: 'absolute', right: 10, top: 10, padding: 5,  borderColor: '#777777', borderStyle: 'solid', borderWidth: 1}}>
                <MenuTrigger>
                    <Icon name="tune" size={20} color="#ffffff" />
                </MenuTrigger>
                <MenuOptions>
                    <MenuOption text="Change" onSelect={() => onChange(type, index)} />
                    <MenuOption text="Remove" onSelect={() => onRemove(type, index)} />
                    <View style={{marginVertical: 5, marginHorizontal: 2, borderBottomWidth: 1, borderColor: '#cccccc'}}/>
                    <MenuOption text={'Device: ' + device.device_name } disabled={true} />
                </MenuOptions>
            </Menu>
        </View>);
    }

    return (<View style={{flex: 1}}>
        <TouchableOpacity style={{flex:1, alignItems: 'center', justifyContent: 'center'}} onPress={() => onChange(type, index)}>
            <Icon name="add-circle-outline" size={90} color="#ffffff" />
        </TouchableOpacity>
    </View>);
}

function TwinPlayerSection({type = 1, index = 0, onChange, onRemove, screenDevices, rtspUrl}) {
    const groupIndex = index * 2;
    return (<View style={{flex: 1, flexDirection: 'row'}}>
        <SinglePlayerSection type={type} index={groupIndex} onChange={onChange} onRemove={onRemove} screenDevices={screenDevices} rtspUrl={rtspUrl} />
        <SinglePlayerSection type={type} index={groupIndex + 1} onChange={onChange} onRemove={onRemove} screenDevices={screenDevices} rtspUrl={rtspUrl} />
    </View>);
}

function QuadPlayerSection({onChange, onRemove, screenDevices, rtspUrl}) {
    return (<View style={{flex: 1}}>
        <TwinPlayerSection type={2} index={0} onChange={onChange} onRemove={onRemove} screenDevices={screenDevices} rtspUrl={rtspUrl} />
        <TwinPlayerSection type={2} index={1} onChange={onChange} onRemove={onRemove} screenDevices={screenDevices} rtspUrl={rtspUrl} />
    </View>);
}


function ScreenButton({onPress, name, active = false}) {
    return (<TouchableOpacity style={{backgroundColor: active ? '#007700' : '#333333', marginLeft: 5, marginRight: 5, borderColor: '#777777', borderStyle: 'solid', borderWidth: 1}} onPress={onPress}>
        <Text style={{color: 'white', height: 30, width: 30, textAlignVertical: 'center', textAlign: 'center'}}>{name}</Text>
    </TouchableOpacity>);
}

function PlayerScreen({navigation}) {

    const [activeScreen, setActiveScreen] = useState(0);
    const {state, dispatch} = useContext(SessionContext);

    const screenDevices = state.selectedDeviceList.map(screens =>
        screens.map(deviceId => deviceId && state.deviceList.find(({id}) => id === deviceId)));

    const rtspUrl = getRtspAddressByCredentials(state.activeAccount);

    const onAddCamera = useCallback((type, index) =>
        navigation.navigate('DeviceSetCamera', {
            type, index
        }), []);

    const onRemoveCamera = useCallback(async (type, index) => {
        const selectedDeviceList = await setSelectedCamera(state.activeAccount.id, type, index,
            null, state.selectedDeviceList);
        dispatch({type: 'update_selected_device_list', payload: selectedDeviceList});
    }, []);

    const screens = [
        ['1', <SinglePlayerSection onChange={onAddCamera} onRemove={onRemoveCamera} screenDevices={screenDevices} rtspUrl={rtspUrl} />],
        ['2', <TwinPlayerSection onChange={onAddCamera} onRemove={onRemoveCamera} screenDevices={screenDevices} rtspUrl={rtspUrl} />],
        ['4', <QuadPlayerSection onChange={onAddCamera} onRemove={onRemoveCamera} screenDevices={screenDevices} rtspUrl={rtspUrl} />]
    ];

    return (<View style={{flex: 1}}>
        {screens[activeScreen][1]}
        <View style={{color: 'white', position: 'absolute', left:10, bottom: 10, flexDirection: 'row'}}>
            {screens.map(([target], index) =>
                <ScreenButton key={index} name={target} active={index === activeScreen} onPress={() => setActiveScreen(index)} />)}
        </View>
    </View>);
}

function DirectPlayScreen({route: {params: {deviceId}}, navigation}) {

    const {state} = useContext(SessionContext);

    const device = state.deviceList.find(({id}) => parseInt(id) === parseInt(deviceId));

    useEffect(() => {
        SplashScreen.hide();
    });

    if (!device) {
        return <PlayerError onPress={() => navigation.navigate('DeviceShowCamera')} />;
    }

    const rtspUrl = getRtspAddressByCredentials(state.activeAccount);

    return (<View style={{flex: 1}}>
        <Player key={'device_' + device.id} uri={rtspUrl + '/live/' + device.id} />
        <Menu style={{backgroundColor: '#333333', position: 'absolute', right: 10, top: 10, padding: 5,  borderColor: '#777777', borderStyle: 'solid', borderWidth: 1}}>
            <MenuTrigger>
                <Icon name="tune" size={20} color="#ffffff" />
            </MenuTrigger>
            <MenuOptions>
                <MenuOption text="Close" onSelect={() => navigation.navigate('DeviceShowCamera')} />
                <View style={{marginVertical: 5, marginHorizontal: 2, borderBottomWidth: 1, borderColor: '#cccccc'}}/>
                <MenuOption text={'Device: ' + device.device_name } disabled={true} />
            </MenuOptions>
        </Menu>
    </View>);
}

function SetCameraScreen({route: {params: {index, type}}, navigation}) {

    const [loading, setLoading] = useState(false);
    const {state, dispatch} = useContext(SessionContext);

    const onSelectCamera = useCallback(async (id) => {
        setLoading(true);

        const selectedDeviceList = await setSelectedCamera(state.activeAccount.id, type,
            index, id, state.selectedDeviceList);
        dispatch({type: 'update_selected_device_list', payload: selectedDeviceList});
        navigation.goBack();

    }, []);

    return <View style={{flex: 1, justifyContent: 'center'}}>
        {loading ? <ActivityIndicator size="large" color="white"  /> : <FlatList data={state.deviceList} keyExtractor={({id}) => '' + id} renderItem={({item: {id, device_name}}) =>
            <TouchableOpacity style={{marginTop: 5, paddingLeft: 10, paddingRight: 10, paddingTop: 15,
                paddingBottom: 15, backgroundColor: '#333333'}} onPress={() => onSelectCamera(id)}>
                <Text style={{color: 'white'}}>#{id} - {device_name}</Text></TouchableOpacity>} />}
    </View>;
}

function ShowCameraScreen({navigation}) {

    const {state} = useContext(SessionContext);

    return <View style={{flex: 1, justifyContent: 'center'}}>
        <FlatList data={state.deviceList} keyExtractor={({id}) => '' + id} renderItem={({item: {id, device_name}}) =>
            <TouchableOpacity style={{marginTop: 5, paddingLeft: 10, paddingRight: 10, paddingTop: 15,
                paddingBottom: 15, backgroundColor: '#333333'}} onPress={() => {
                navigation.navigate('DeviceDirectPlay', {
                    deviceId: id
                })
            }}>
                <Text style={{color: 'white'}}>#{id} - {device_name}</Text></TouchableOpacity>} />
    </View>;
}

export function CameraScreen() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="DevicePlayer" component={PlayerScreen} options={{headerShown: false}} />
            <Stack.Screen name="DeviceSetCamera" options={{title: 'Set Camera to Screen'}} component={SetCameraScreen} />
        </Stack.Navigator>);
}

export function DirectCameraScreen() {
    return (<Stack.Navigator>
            <Stack.Screen name="DeviceShowCamera" options={{title: 'Show Camera'}} component={ShowCameraScreen} />
            <Stack.Screen name="DeviceDirectPlay" component={DirectPlayScreen} options={{headerShown: false}} />
        </Stack.Navigator>);
}

