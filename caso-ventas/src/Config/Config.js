export const API_CONFIG = {
  BASE_URL: 'http://localhost/caso2examendegrado/server/src/',
  ENDPOINTS: {
    // Autenticación
    AUTH: {
      LOGIN: 'login.php',
    },

    // Usuarios
    USERS: {
      GET_USERS: 'usuarios/getUsers.php',
      CREATE_USER: 'usuarios/createUser.php',
      UPDATE_USER: 'usuarios/updateUser.php',
      TOGGLE_USER_STATUS: 'usuarios/toggleUserStatus.php',
      GET_VENDOR_INFO: 'usuarios/getVendorInfo.php',
    },

    // Roles y ubicaciones
    ROLES_LOCATIONS: {
      GET_ROLES_AND_LOCATIONS: 'rolesyubicaciones/getRolesAndLocations.php',
    },

    // Mapas
    MAPS: {
      GET_LOCATIONS: 'localizaciones/getLocations.php',
      CREATE_LOCATION: 'localizaciones/createLocation.php',
      UPDATE_LOCATION: 'localizaciones/updateLocation.php',
      TOGGLE_LOCATION_STATUS: 'localizaciones/toggleLocationStatus.php',
    },

    //Asiganaciones chofer
    ASSIGNMENTS: {
      CREATE_DRIVER_ROUTE: 'asignacioneschofer/createDriverRoute.php',
      GET_DRIVER_ROUTES: 'asignacioneschofer/getDriverRoutes.php',
      GET_DRIVERS: 'asignacioneschofer/getDrivers.php',
      GET_VENDORS: 'asignacioneschofer/getVendors.php',
      REMOVE_VENDOR_FROM_ROUTE: 'asignacioneschofer/removeVendorFromRoute.php',
      UPDATE_DRIVER_ROUTE: 'asignacioneschofer/updateDriverRoute.php',
    },
  },
};

export const getApiUrl = (category, endpoint) => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[category][endpoint]}`;
};