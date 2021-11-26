export const initialState = {
  activeAccount: null,
  accountList: [],
  deviceList: [],
  selectedDeviceList: [[null], [null, null], [null, null, null, null]],
  targetDevice: null,
};

export function reducer(state, action) {
  switch (action.type) {
    case 'login':
      return {
        ...initialState,
        activeAccount: action.payload,
        targetDevice: action.targetDevice,
      };
    case 'logout':
      return {...initialState};
    case 'update_account_list':
      return {...state, accountList: action.payload};
    case 'update_device_list':
      return {...state, deviceList: action.payload};
    case 'update_selected_device_list':
      return {...state, selectedDeviceList: action.payload};
    case 'update_all_device_list':
      return {
        ...state,
        deviceList: action.deviceList,
        selectedDeviceList: action.selectedDeviceList,
      };
  }
}
