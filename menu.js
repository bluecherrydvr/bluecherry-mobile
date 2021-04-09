
import React from 'react';

import {
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem
} from '@react-navigation/drawer';

import {unsetActiveAccount} from "./lib/storage";

import SessionContext from './session-context';

export default function DrawerMenu(props) {
    return (
        <SessionContext.Consumer>{({dispatch}) => <DrawerContentScrollView {...props}>
            <DrawerItemList {...props} />
            <DrawerItem label="Logout" onPress={async() => {
                await unsetActiveAccount();
                dispatch({type: 'logout'});
            }} />
        </DrawerContentScrollView>}</SessionContext.Consumer>
    );
}
