import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Plus, Calendar, Truck, User, Edit } from 'lucide-react';
import Navbar from '../components/Navbar';
import RouteModal from '../components/RouteModal';
import { getApiUrl } from '../Config/Config';

const DriverRoute = () => {
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchRoutes();
    fetchDrivers();
  }, []);

  useEffect(() => {
    if (routes.length > 0) {
      const filtered = routes.filter(route => {
        const driverName = drivers.find(d => d.id_usuario === route.id_chofer)?.nombre || '';
        const driverLastName = drivers.find(d => d.id_usuario === route.id_chofer)?.apellido_p || '';
        const fullName = `${driverName} ${driverLastName}`.toLowerCase();
        
        // Formatear la fecha para búsqueda en el mismo formato que se muestra
        const formattedDate = formatDate(route.fecha).toLowerCase();
        
        // Incluir también la fecha en formato DD/MM/YYYY para búsqueda
        const dateParts = route.fecha.split('-');
        const day = dateParts[2];
        const month = dateParts[1];
        const year = dateParts[0];
        const simpleDateFormat = `${day}/${month}/${year}`.toLowerCase();
        
        const searchTermLower = searchTerm.toLowerCase();
        
        return fullName.includes(searchTermLower) || 
               formattedDate.includes(searchTermLower) || 
               simpleDateFormat.includes(searchTermLower) ||
               route.id_ruta.toString().includes(searchTerm);
      });
      setFilteredRoutes(filtered);
    }
  }, [searchTerm, routes, drivers]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('ASSIGNMENTS', 'GET_DRIVER_ROUTES'));
      const data = await response.json();
      
      if (data.success) {
        console.log("Rutas recibidas:", data.routes);
        setRoutes(data.routes);
        setFilteredRoutes(data.routes);
      } else {
        toast.error('Error al cargar las rutas');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las rutas');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch(getApiUrl('ASSIGNMENTS', 'GET_DRIVERS'));
      const data = await response.json();
      
      if (data.success) {
        setDrivers(data.drivers);
      } else {
        toast.error('Error al cargar los choferes');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los choferes');
    }
  };

  const handleCreateRoute = () => {
    setCurrentRoute(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditRoute = (route) => {
    setCurrentRoute(route);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSaveRoute = async (routeData) => {
    try {
      // Si estamos en modo edición, usamos updateDriverRoute.php
      const endpoint = isEditMode 
        ? getApiUrl('ASSIGNMENTS', 'UPDATE_DRIVER_ROUTE')
        : getApiUrl('ASSIGNMENTS', 'CREATE_DRIVER_ROUTE');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(isEditMode ? 'Ruta actualizada exitosamente' : 'Ruta creada exitosamente');
        fetchRoutes(); // Recargar las rutas
        return true;
      } else {
        toast.error(data.message || (isEditMode ? 'Error al actualizar la ruta' : 'Error al crear la ruta'));
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(isEditMode ? 'Error al actualizar la ruta' : 'Error al crear la ruta');
      return false;
    }
  };

  // Función para obtener el nombre del chofer
  const getDriverName = (driverId) => {
    const driver = drivers.find(d => d.id_usuario === driverId);
    if (driver) {
      return `${driver.nombre} ${driver.apellido_p} ${driver.apellido_m}`;
    }
    return 'Chofer no encontrado';
  };

  // Formatear fecha para mostrar - Corregimos el problema de la zona horaria
  const formatDate = (dateString) => {
    // Creamos un objeto Date con la fecha UTC
    const date = new Date(dateString + 'T00:00:00Z');
    
    // Obtenemos el string de la fecha en la zona horaria local
    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Rutas de Choferes</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por chofer o fecha..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <button
                onClick={handleCreateRoute}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors cursor-pointer"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear Ruta para Hoy
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {filteredRoutes.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Ruta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chofer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedores Asignados</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRoutes.map((route) => (
                      <tr key={route.id_ruta} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-purple-100 rounded-full">
                              <Truck className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">#{route.id_ruta}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">{formatDate(route.fecha)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{getDriverName(route.id_chofer)}</div>
                        </td>
                        <td className="px-6 py-4">
                          {route.vendedores && route.vendedores.length > 0 ? (
                            <div className="space-y-1">
                              {route.vendedores.map((vendor) => (
                                <div key={vendor.id_vendedor} className="flex items-center text-sm text-gray-900">
                                  <User className="h-4 w-4 text-gray-400 mr-2" />
                                  {`${vendor.nombre} ${vendor.apellido_p} ${vendor.apellido_m}`}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No hay vendedores asignados</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleEditRoute(route)}
                            className="p-2 bg-amber-100 text-amber-600 rounded-full hover:bg-amber-200 transition-colors cursor-pointer"
                            title="Editar ruta"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No se encontraron rutas</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <RouteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRoute}
        drivers={drivers}
        currentRoute={currentRoute}
        isEditMode={isEditMode}
      />
    </div>
  );
};

export default DriverRoute;