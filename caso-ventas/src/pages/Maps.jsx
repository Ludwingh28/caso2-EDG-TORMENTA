import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Edit, Plus } from 'lucide-react';
import Navbar from '../components/Navbar';
import MapModal from '../components/MapModal';
import { getApiUrl } from '../Config/Config';

const Maps = () => {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    const filtered = locations.filter(location =>
      location.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLocations(filtered);
  }, [searchTerm, locations]);

  const fetchLocations = async () => {
    try {
      const response = await fetch(getApiUrl('MAPS', 'GET_LOCATIONS')); // Usa getApiUrl para obtener la URL completa
      const data = await response.json();
      if (data.success) {
        setLocations(data.locations);
        setFilteredLocations(data.locations);
      } else {
        toast.error('Error al cargar lugares de venta');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar lugares de venta');
    }
  };

  const handleToggleStatus = async (locationId, currentStatus) => {
    try {
      const response = await fetch(getApiUrl('MAPS', 'TOGGLE_LOCATION_STATUS'), { // Usa getApiUrl para obtener la URL completa
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId,
          currentStatus,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchLocations();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cambiar el estado del lugar de venta');
    }
  };

  const handleEdit = (location) => {
    setSelectedLocation(location);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedLocation(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleSaveLocation = async (locationData) => {
    try {
      // Verificar si el nombre ya existe
      if (isCreating) {
        const nameExists = locations.some(
          loc => loc.nombre.toLowerCase() === locationData.nombre.toLowerCase()
        );
        
        if (nameExists) {
          toast.error('El nombre del lugar ya existe. Por favor, elija otro nombre.');
          return false;
        }
      } else if (
        locationData.nombre.toLowerCase() !== 
        selectedLocation.nombre.toLowerCase() && 
        locations.some(loc => 
          loc.id_lugarVenta !== selectedLocation.id_lugarVenta && 
          loc.nombre.toLowerCase() === locationData.nombre.toLowerCase()
        )
      ) {
        toast.error('El nombre del lugar ya existe. Por favor, elija otro nombre.');
        return false;
      }

      const endpoint = isCreating 
        ? getApiUrl('MAPS', 'CREATE_LOCATION') // Usa getApiUrl para obtener la URL completa
        : getApiUrl('MAPS', 'UPDATE_LOCATION'); // Usa getApiUrl para obtener la URL completa

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchLocations();
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar el lugar de venta');
      return false;
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLocation(null);
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Lugares de Venta</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <button
                onClick={handleCreate}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors cursor-pointer"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear Lugar de Venta
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latitud</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Longitud</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLocations.map((location) => (
                  <tr key={location.id_lugarVenta}>
                    <td className="px-6 py-4 whitespace-nowrap">{location.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{location.latitud}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{location.longitud}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          location.estado === 'disponible'
                            ? 'bg-green-100 text-green-800'
                            : location.estado === 'ocupado'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {location.estado}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(location.id_lugarVenta, location.estado)}
                        className={`ml-3 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                          location.estado !== 'desactivado' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            location.estado !== 'desactivado' ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(location)}
                        className="text-purple-600 hover:text-purple-900 cursor-pointer"
                        disabled={location.estado === 'desactivado'}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <MapModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        location={selectedLocation}
        allLocations={locations}
        onSave={handleSaveLocation}
        isCreating={isCreating}
      />
    </div>
  );
};

export default Maps;