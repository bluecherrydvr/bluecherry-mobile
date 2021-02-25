
import {createContext} from 'react';

export default createContext({
    loggedInAccountId: false,
    accountList: [],
    setLoginAccountId: () => {},
    updateAccountList: () => {}
});
