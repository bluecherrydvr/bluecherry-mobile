
import React, {useEffect, useState, useCallback, useContext, useRef} from 'react';
import {View, Text, FlatList, TouchableOpacity, SafeAreaView} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import dayJs from 'dayjs';

import {getEvents} from '../lib/api';

import {getAddressByCredentials} from '../lib/util';

import PlayerError from '../components/PlayerError';

import { VLCPlayer } from 'react-native-vlc-media-player';

import SessionContext from '../session-context';

import {Menu, MenuOption, MenuOptions, MenuTrigger} from "react-native-popup-menu";
import Icon from "react-native-vector-icons/MaterialIcons";

import ToggleNavigationButton from '../components/ToggleNavigationButton';

const Stack = createStackNavigator();

const dateFormat = 'M-D-YY h:mm:s A';

function Player({uri}) {
    const [error, setError] = useState(false);
    const [stopped, setStopped] = useState(false);

    const player = useRef(null);

    if (error) {
        return <PlayerError onPress={() => setError(false)} />;
    }

    if (stopped) {
        return <TouchableOpacity onPress={() => setStopped(false)} style={{backgroundColor: '#333333', flex: 1, alignItems: 'center', justifyContent: 'center'}}><Icon name="replay" size={90} color="#ffffff" /></TouchableOpacity>;
    }

    return <VLCPlayer ref={player} source={{uri}} autoplay={true} autoAspectRatio={true} resizeMode="contain"
                      onError={() => setError(true)} style={{flex: 1}} onStopped={() => setStopped(true)} />;
}

function EventButton({id, title, published, updated, active, current}) {
    return (<View style={{backgroundColor: active ? (current ? '#007700' : '#777777') : '#333333',
        marginTop: 5, paddingLeft: 10, paddingRight: 10, paddingTop:15,
        paddingBottom:15}}>
        <View><Text style={{color: active ? 'white' : '#777777'}}>{title}</Text></View>
        {updated ? <View><Text style={{color: active ? 'white' : '#777777'}}>Updated: {dayJs(updated).format(dateFormat)}</Text></View> :
            (published ? <View><Text style={{color: active ? 'white' : '#777777'}}>Published: {published}</Text></View> : null)}
    </View>);
}


function EventList({navigation}) {

    const {state} = useContext(SessionContext);
    const [lastUpdate, setLastUpdate] = useState();
    const [eventList, setEventList] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getEvents(getAddressByCredentials(state.activeAccount)).then(([list, update]) => {
            setEventList(list);
            setLastUpdate(dayJs(update).format(dateFormat));
            setRefreshing(false);
        });
    }, [state.activeAccount]);

    useEffect(() => {
        onRefresh();
    }, []);
    return (<SafeAreaView style={{flex: 1}}>
        {lastUpdate && (<View style={{flexDirection: 'row', padding: 10, backgroundColor: '#333333'}}>
            <Text style={{color: 'white'}}>Last Update:</Text><Text style={{color: 'white', marginLeft: 10}}>{lastUpdate}</Text>
        </View>)}
        <View style={{flex: 1}}><FlatList
            data={eventList}
            keyExtractor={({id}) => id}
            refreshing={refreshing}
            onRefresh={onRefresh}
            renderItem={({item}) => (<TouchableOpacity onPress={() =>
                navigation.navigate('EventVideoPlayer', {eventId: item.content})}>
                        <EventButton {...item} /></TouchableOpacity>)}/></View>
    </SafeAreaView>);
}

function EventVideoPlayer({route: {params: {eventId}}, navigation}) {

    const {state} = useContext(SessionContext);

    if (!eventId) {
        return <PlayerError onPress={() => navigation.navigate('EventList')} />;
    }

    return (<View style={{flex: 1}}>
        <Player key={'event_video_' + eventId} uri={getAddressByCredentials(state.activeAccount, true) +'/media/request.php?id=' + eventId} />
        <Menu style={{backgroundColor: '#333333', position: 'absolute', right: 10, top: 10, padding: 5,
            borderColor: '#777777', borderStyle: 'solid', borderWidth: 1}}>
            <MenuTrigger>
                <Icon name="tune" size={20} color="#ffffff" />
            </MenuTrigger>
            <MenuOptions>
                <MenuOption text="Events" onSelect={() => navigation.navigate('EventList')} />
            </MenuOptions>
        </Menu>
    </View>);
}

export default function EventScreen() {
    return (<Stack.Navigator>
        <Stack.Screen name="EventList" options={{title: 'Events', headerLeft: () => <View style={{paddingLeft:15}}><ToggleNavigationButton /></View>}} component={EventList} />
        <Stack.Screen name="EventVideoPlayer" options={{headerShown: false}} component={EventVideoPlayer} />
    </Stack.Navigator>);
}
