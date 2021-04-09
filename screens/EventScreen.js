
import React, {useEffect, useState, useCallback, useContext} from 'react';
import {View, Text, FlatList, TouchableOpacity, ActivityIndicator, useWindowDimensions} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {getEvents} from '../lib/api';

import {getAddressByCredentials} from '../lib/util';

import Video from 'react-native-video';

import SessionContext from '../session-context';

import Toast from 'react-native-toast-message';

function EventButton({id, title, published, updated, active, current}) {
    return (<View style={{backgroundColor: active ? (current ? '#007700' : '#777777') : '#333333',
        marginTop: 5, paddingLeft: 10, paddingRight: 10, paddingTop:15,
        paddingBottom:15}}>
        <View><Text style={{color: active ? 'white' : '#777777'}}>{title}</Text></View>
        {updated ? <View><Text style={{color: active ? 'white' : '#777777'}}>Updated: {updated}</Text></View> :
            (published ? <View><Text style={{color: active ? 'white' : '#777777'}}>Published: {published}</Text></View> : null)}
    </View>);
}

export default function EventScreen({navigation}) {

    const [activeItem, setActiveItem] = useState();
    const [lastUpdate, setLastUpdate] = useState();
    const [eventList, setEventList] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [playerHeight, setPlayerHeight] = useState(0);
    const [loading, setLoading] = useState(false);

    const {height: windowHeight, width: windowWidth} = useWindowDimensions();

    const {state} = useContext(SessionContext);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getEvents(getAddressByCredentials(state.activeAccount)).then(([list, update]) => {
            setEventList(list);
            setLastUpdate(update);
            setRefreshing(false);
        });
    }, []);

    useEffect(() => {
        onRefresh();
    }, []);

    const onVideoLoad = useCallback(({naturalSize: {width, height}}) => {
        setLoading(false);
        setPlayerHeight(Math.round(windowWidth / (width / height)));
    }, [activeItem]);

    const onVideoError = useCallback(() => {

        Toast.show({
            type: 'error',
            text1: 'Video Error'
        })

        setLoading(false);
        setPlayerHeight(0);

    }, [activeItem]);

    useFocusEffect(useCallback(() => {
        return () => {
            setActiveItem(null);
            setLoading(false);
        }
    }, []));

    const targetEvent = activeItem && eventList.find(({id}) => activeItem === id);

    return (<View style={{flex: 1}}>
            {targetEvent && targetEvent.content ? <Video key={targetEvent.content} controls={!loading} style={{height: playerHeight}} paused={false} resizeMode="contain" source={{uri: getAddressByCredentials(state.activeAccount) +'/media/request.php?id=' + targetEvent.content}} onLoad={onVideoLoad} onError={onVideoError} /> : null}
            {activeItem && loading && <View style={{height: Math.round(windowWidth / (1.77)), alignItems: 'center', justifyContent: 'center'}}>
                <ActivityIndicator size="large" color="white" />
                <Text style={{color: 'white'}}>Event ({activeItem}) is opening</Text>
            </View>}
            {lastUpdate && (<View style={{flexDirection: 'row', padding: 10, backgroundColor: '#333333'}}>
                <Text style={{color: 'white'}}>Last Update:</Text><Text style={{color: 'white', marginLeft: 10}}>{lastUpdate}</Text>
            </View>)}
            <View style={{flex: 1}}><FlatList
                data={eventList}
                keyExtractor={({id}) => id}
                refreshing={refreshing}
                onRefresh={onRefresh}
                renderItem={({item}) => (item.content ?
                    (<TouchableOpacity onPress={() => {
                        setPlayerHeight(0);
                        if (activeItem && activeItem === item.id) {
                            setLoading(false);
                            setActiveItem(null);
                        } else {
                            setLoading(true);
                            setActiveItem(item.id);
                        }
                    }}>
                        <EventButton {...item} active={true} current={item.id === activeItem} /></TouchableOpacity>) :
                    (<EventButton {...item} active={false} current={item.id === activeItem} />)
                )}
            /></View>
    </View>);
}
