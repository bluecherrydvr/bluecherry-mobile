import React, {useEffect, useState, useCallback, useContext, useRef} from 'react';
import {View, Text, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, StyleSheet} from 'react-native';
import {Menu, MenuOption, MenuOptions, MenuTrigger} from 'react-native-popup-menu';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Micon from 'react-native-vector-icons/MaterialCommunityIcons';
import {createStackNavigator} from '@react-navigation/stack';
import dayJs from 'dayjs';
import {VLCPlayer} from 'react-native-vlc-media-player';
import * as RNLocalize from 'react-native-localize';
import {getEvents} from '../lib/api';
import {getAddressByCredentials} from '../lib/util';
import PlayerError from '../components/PlayerError';
import SessionContext from '../session-context';
import ToggleNavigationButton from '../components/ToggleNavigationButton';
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayJs.extend(utc);
dayJs.extend(timezone);

const Stack = createStackNavigator();
const getLocalTime = (dateTime, dateFormat) => {
  const localTimezone = RNLocalize.getTimeZone();
  return dayJs(dateTime).utc().local().tz(localTimezone).format(dateFormat);
};
function Player({uri}) {
  const [error, setError] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [loading, setLoading] = useState(true);
  const player = useRef(null);

  if (error) {
    return <PlayerError onPress={() => setError(false)} />;
  }
  const onError = () => {
    setError(true);
    setLoading(false);
  };
  const onStopped = () => {
    setStopped(true);
    setLoading(false);
  };
  if (stopped) {
    return (
      <TouchableOpacity
        onPress={() => setStopped(false)}
        style={{
          backgroundColor: '#333333',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon name="replay" size={90} color="#ffffff" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={{flex: 1}}>
      {loading && (
        <ActivityIndicator style={{position: 'absolute', top: 0, left: 0, right: 0}} size="large" color="white" />
      )}
      <VLCPlayer
        ref={player}
        source={{uri}}
        autoplay={true}
        autoAspectRatio={true}
        resizeMode="contain"
        onError={() => onError()}
        style={{flex: 1}}
        onProgress={() => setLoading(false)}
        onStopped={() => onStopped()}
      />
    </View>
  );
}

function EventButton({id, title, published, updated, active, current, dateFormat}) {
  return (
    <View
      style={{
        backgroundColor: active ? (current ? '#007700' : '#777777') : '#333333',
        marginTop: 5,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 15,
        paddingBottom: 15,
      }}>
      <View>
        <Text style={{color: active ? 'white' : '#777777'}}>{title}</Text>
      </View>
      {updated ? (
        <View>
          <Text style={{color: active ? 'white' : '#777777'}}>Updated: {getLocalTime(updated, dateFormat)}</Text>
        </View>
      ) : published ? (
        <View>
          <Text style={{color: active ? 'white' : '#777777'}}>Published: {published}</Text>
        </View>
      ) : null}
    </View>
  );
}

function EventList({navigation}) {
  const {state} = useContext(SessionContext);
  const [lastUpdate, setLastUpdate] = useState();
  const [eventList, setEventList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const dateFormat = state.activeAccount.dateFormat;

  console.log('Timezone=====>', RNLocalize.getTimeZone());
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getEvents(getAddressByCredentials(state.activeAccount)).then(([list, update]) => {
      setEventList(list);
      setLastUpdate(getLocalTime(update, dateFormat));
      setRefreshing(false);
    });
  }, [state.activeAccount]);

  useEffect(() => {
    onRefresh();
  }, []);

  return (
    <SafeAreaView style={{flex: 1}}>
      {lastUpdate && (
        <View
          style={{
            flexDirection: 'row',
            padding: 10,
            backgroundColor: '#333333',
          }}>
          <Text style={{color: 'white'}}>Last Update:</Text>
          <Text style={{color: 'white', marginLeft: 10}}>{lastUpdate}</Text>
        </View>
      )}
      <View style={{flex: 1}}>
        <FlatList
          data={eventList}
          keyExtractor={({id}) => id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({item, index}) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('EventVideoPlayer', {
                  eventId: item.content,
                  eventList,
                  index,
                })
              }>
              <EventButton dateFormat={dateFormat} {...item} />
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

/*
 * EventVideoPlayer function components styles
 * */

const eventVideoPlayerStyles = StyleSheet.create({
  commonNextPreviousButton: {
    borderColor: '#777777',
    borderStyle: 'solid',
    borderWidth: 1,
    backgroundColor: '#333333',
    position: 'absolute',
    bottom: 0,
    padding: 5,
    marginBottom: 10,
  },
  previousButton: {
    left: 0,
    marginLeft: 30,
  },
  nextButton: {
    right: 0,
    marginRight: 30,
  },
});

function EventVideoPlayer({
  route: {
    params: {eventList, index},
  },
  navigation,
}) {
  const [eventId, setEventId] = useState(eventList[index].content);
  const [lockIndex, setLockIndex] = useState(index);
  const {state} = useContext(SessionContext);

  if (!eventId) {
    return <PlayerError onPress={() => navigation.navigate('EventList')} />;
  }

  /*
   * Handle previous event from event list
   * */

  const previousEvent = () => {
    if (lockIndex > 0) {
      const tempIndex = lockIndex - 1;
      setLockIndex(tempIndex);
      setEventId(eventList[tempIndex]?.content);
    }
  };

  /*
   * Handle next event from event list
   * */

  const nextEvent = () => {
    if (lockIndex <= eventList.length - 1) {
      const tempIndex = lockIndex + 1;
      setLockIndex(tempIndex);
      setEventId(eventList[tempIndex]?.content);
    }
  };

  return (
    <View style={{flex: 1}}>
      <Player
        key={'event_video_' + eventId}
        uri={getAddressByCredentials(state.activeAccount, true) + '/media/request.php?id=' + eventId}
      />
      <TouchableOpacity
        style={[eventVideoPlayerStyles.commonNextPreviousButton, eventVideoPlayerStyles.previousButton]}
        onPress={() => previousEvent()}>
        <Micon name="page-previous-outline" size={25} color="#ffffff" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[eventVideoPlayerStyles.commonNextPreviousButton, eventVideoPlayerStyles.nextButton]}
        onPress={() => nextEvent()}>
        <Micon name="page-next-outline" size={25} color="#ffffff" />
      </TouchableOpacity>
      <Menu
        style={{
          backgroundColor: '#333333',
          position: 'absolute',
          right: 10,
          top: 10,
          padding: 5,
          borderColor: '#777777',
          borderStyle: 'solid',
          borderWidth: 1,
        }}>
        <MenuTrigger>
          <Icon name="tune" size={20} color="#ffffff" />
        </MenuTrigger>
        <MenuOptions>
          <MenuOption text="Events" onSelect={() => navigation.navigate('EventList')} />
        </MenuOptions>
      </Menu>
    </View>
  );
}

export default function EventScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="EventList"
        options={{
          title: 'Events',
          headerLeft: () => (
            <View style={{paddingLeft: 15}}>
              <ToggleNavigationButton />
            </View>
          ),
        }}
        component={EventList}
      />
      <Stack.Screen name="EventVideoPlayer" options={{headerShown: false}} component={EventVideoPlayer} />
    </Stack.Navigator>
  );
}
