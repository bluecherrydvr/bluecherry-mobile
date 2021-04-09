
import {createContext} from 'react';
import {initialState} from './state';

export default createContext({
    state: {...initialState},
    dispatch: () => {},
    updateAccountList: () => {}
});
