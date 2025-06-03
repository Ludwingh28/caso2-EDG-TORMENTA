import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { toast } from 'sonner';
import PropTypes from 'prop-types';
import { X, Crosshair } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para los íconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Componente para controlar el centro del mapa
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
};

MapController.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number)
};

const MapModal = ({ isOpen, onClose, location, allLocations, onSave, isCreating = false }) => {
  const [nombre, setNombre] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [newPosition, setNewPosition] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);

  // Función para limpiar el formulario
  const resetForm = () => {
    setNombre('');
    setLatitud('');
    setLongitud('');
    setNewPosition(null);
    setUserLocation(null);
  };

  // Función para obtener la ubicación actual
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La geolocalización no está disponible en tu navegador');
      return;
    }

    toast.info('Obteniendo tu ubicación...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setLatitud(latitude.toFixed(7));
        setLongitud(longitude.toFixed(7));
        setNewPosition([latitude, longitude]);
        toast.success('Ubicación obtenida correctamente');
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('No se pudo obtener tu ubicación');
        // Usar ubicación por defecto si falla
        setDefaultLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const setDefaultLocation = () => {
    // ubicacion por defecto
    setLatitud('-17.770094');
    setLongitud('-63.2020843');
    setNewPosition([-17.770094, -63.202084]);
  };

  // Limpiar el formulario cuando se cierra el modal o cuando cambia isOpen
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Configurar la posición inicial
  useEffect(() => {
    if (isOpen) {
      if (isCreating) {
        resetForm();
        getCurrentLocation();
      } else if (location) {
        setNombre(location.nombre || '');
        setLatitud(location.latitud || '');
        setLongitud(location.longitud || '');
        setNewPosition([parseFloat(location.latitud), parseFloat(location.longitud)]);
      }
    }
  }, [location, isCreating, isOpen]);

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (!latitud || !longitud) {
      toast.error('La ubicación en el mapa es obligatoria');
      return;
    }

    try {
      const locationData = isCreating
        ? {
            nombre,
            latitud,
            longitud
          }
        : {
            id: location?.id_lugarVenta,
            nombre,
            latitud,
            longitud
          };
      
      const success = await onSave(locationData);
      if (success) {
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar los cambios');
    }
  };

  // Obtener un color según el estado
  const getStatusColor = (estado) => {
    switch (estado) {
      case 'disponible': return 'green';
      case 'ocupado': return 'blue';
      case 'desactivado': return 'red';
      default: return 'gray';
    }
  };

  // Componente para manejar eventos del mapa
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setLatitud(lat.toFixed(7));
        setLongitud(lng.toFixed(7));
        setNewPosition([lat, lng]);
      },
    });
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {isCreating ? 'Crear Nuevo Lugar de Venta' : 'Editar Lugar de Venta'}
          </h2>
          <button 
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Ingrese el nombre del lugar de venta"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Latitud</label>
                <input
                  type="text"
                  value={latitud}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Longitud</label>
                <input
                  type="text"
                  value={longitud}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                />
              </div>
            </div>

            <div className="bg-gray-100 p-3 rounded-md">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Instrucciones:</span> Haz clic en el mapa para seleccionar la ubicación.
                Los marcadores azules son otras ubicaciones existentes.
              </p>
              {isCreating && (
                <button
                  onClick={getCurrentLocation}
                  className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                >
                  <Crosshair className="h-4 w-4 mr-2" />
                  Usar mi ubicación actual
                </button>
              )}
            </div>

            <div className="h-96 relative border rounded-lg overflow-hidden">
              {newPosition && (
                <MapContainer 
                  center={newPosition} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  <MapController center={newPosition} />
                  
                  {/* Marcador de la ubicación actual */}
                  <Marker position={newPosition}>
                    <Popup>
                      <div className="font-semibold">{nombre || 'Nueva ubicación'}</div>
                      <div className="text-xs text-gray-500">Coordenadas: {latitud}, {longitud}</div>
                    </Popup>
                  </Marker>
                  
                  {/* Marcadores de todos los lugares de venta */}
                  {allLocations && allLocations.map(loc => (
                    (!isCreating && loc.id_lugarVenta === location?.id_lugarVenta) ? null : (
                      <Marker 
                        key={loc.id_lugarVenta} 
                        position={[parseFloat(loc.latitud), parseFloat(loc.longitud)]}
                        icon={new L.Icon({
                          iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${getStatusColor(loc.estado)}.png`,
                          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                          iconSize: [25, 41],
                          iconAnchor: [12, 41],
                          popupAnchor: [1, -34],
                          shadowSize: [41, 41]
                        })}
                      >
                        <Popup>
                          <div className="font-semibold">{loc.nombre}</div>
                          <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                            loc.estado === 'disponible'
                              ? 'bg-green-100 text-green-800'
                              : loc.estado === 'ocupado'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            Estado: {loc.estado}
                          </div>
                        </Popup>
                      </Marker>
                    )
                  ))}
                  
                  <MapClickHandler />
                </MapContainer>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 cursor-pointer"
              >
                {isCreating ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

MapModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  location: PropTypes.shape({
    id_lugarVenta: PropTypes.number,
    nombre: PropTypes.string,
    latitud: PropTypes.string,
    longitud: PropTypes.string,
    estado: PropTypes.oneOf(['disponible', 'ocupado', 'desactivado'])
  }),
  allLocations: PropTypes.arrayOf(
    PropTypes.shape({
      id_lugarVenta: PropTypes.number.isRequired,
      nombre: PropTypes.string.isRequired,
      latitud: PropTypes.string.isRequired,
      longitud: PropTypes.string.isRequired,
      estado: PropTypes.oneOf(['disponible', 'ocupado', 'desactivado']).isRequired
    })
  ),
  onSave: PropTypes.func.isRequired,
  isCreating: PropTypes.bool
};

MapModal.defaultProps = {
  isCreating: false,
  location: null,
  allLocations: []
};

export default MapModal;