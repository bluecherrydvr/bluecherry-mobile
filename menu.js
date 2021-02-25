
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
        <SessionContext.Consumer>{({setLoginAccountId}) => <DrawerContentScrollView {...props}>
            <DrawerItemList {...props} />
            <DrawerItem label="Logout" onPress={async() => {
                await unsetActiveAccount();
                setLoginAccountId(null);
            }} />
        </DrawerContentScrollView>}</SessionContext.Consumer>
    );
}
