
import React, {useState, useContext} from 'react';
import {Button, Image, View, FlatList, Text, ActivityIndicator} from 'react-native';

import Toast from 'react-native-toast-message';

import {setActiveAccount} from '../lib/storage';

import {checkServerCredentials} from '../lib/api';

import SessionContext from '../session-context';


function ListItem({id, accountInfo, navigation, setLoading, updateActiveAccount}) {

    const {name, address, port, login, password} = accountInfo;

    return (<View style={{flexDirection: 'row'}}>
        <View style={{flex: 1, padding: 5}}>
            <Text style={{color: 'white', textAlignVertical: 'center', flex:1}}>{name}</Text>
        </View>
        <View style={{flexDirection: 'row'}}>
            <View>
                <Button title="Connect" onPress={async() => {

                    setLoading(true);

                    const url = 'https://' + address + (port ? ':' + port : '')

                    try {
                        const status = await checkServerCredentials(url, login, password);
                        if (status === false) {
                            // show edit server screen
                            setLoading(false);
                            return;
                        }

                        await setActiveAccount(id);

                        updateActiveAccount({id, ...accountInfo});
                    } catch (err) {
                        Toast.show({
                            type: 'error',
                            text1: 'Login Error',
                            text2: err.message
                        })
                        setLoading(false);
                    }

                }} />
            </View>
            <View style={{marginLeft: 5}}>
                <Button title="Edit" onPress={() => {

                    navigation.navigate('ServerSettings', {
                        id, ...accountInfo
                    });

                }} />
            </View>
        </View>
    </View>);
}

export default function ConnectServerScreen({navigation}) {
    // const {colors} = useTheme();

    const [loading, setLoading] = useState(false);
    const {state, dispatch} = useContext(SessionContext);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Image width={320} height={320} source={{uri: 'launch_screen'}} style={{width:320, height:320}} />
            {loading ?
                <ActivityIndicator size="large" color="white" /> :
                <><View style={{backgroundColor: '#222222', alignSelf: 'stretch', marginLeft: 10, marginRight: 10, marginBottom:15}}>
                        <FlatList
                            data={state.accountList}
                            renderItem={({item: [id, accountInfo]}) => <ListItem id={id} accountInfo={accountInfo}
                                                                                 navigation={navigation}
                                                                                 setLoading={setLoading}
                                                                                 updateActiveAccount={(activeAccount) =>
                                                                                     dispatch({type: 'login', payload: activeAccount})}/>}
                            keyExtractor={([id]) => id} />
                    </View>
                    <Button
                        title="Add Server"
                        onPress={() => navigation.navigate('ServerSettings')}
                    /></>}

        </View>
    );
}
