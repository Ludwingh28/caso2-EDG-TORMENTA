import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, User, Truck, Trash2, Plus } from 'lucide-react';
import PropTypes from 'prop-types';
import { getApiUrl } from '../Config/Config';

const RouteModal = ({ isOpen, onClose, onSave, drivers, currentRoute, isEditMode }) => {
  const [driverId, setDriverId] = useState('');
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [assignedVendors, setAssignedVendors] = useState([]);
  const [availableVendors, setAvailableVendors] = useState([]);
  const [unassignedVendors, setUnassignedVendors] = useState([]);
  const [newVendorId, setNewVendorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [originalDriverId, setOriginalDriverId] = useState('');

  // Cargar vendedores disponibles y establecer valores iniciales para edición
  useEffect(() => {
    if (isOpen) {
      fetchAvailableVendors();
      
      // Si estamos en modo edición y tenemos datos de la ruta actual
      if (isEditMode && currentRoute) {
        setDriverId(currentRoute.id_chofer.toString());
        setOriginalDriverId(currentRoute.id_chofer.toString());
        
        // En modo edición, los vendedores que ya están asignados a la ruta
        // se muestran en una sección diferente
        const vendorsAlreadyInRoute = currentRoute.vendedores.map(vendor => ({
          id_vendedor: vendor.id_vendedor,
          nombre: vendor.nombre,
          apellido_p: vendor.apellido_p,
          apellido_m: vendor.apellido_m
        }));
        
        setAssignedVendors(vendorsAlreadyInRoute);
        
        // Los vendedores seleccionados para agregar a la ruta se inician como un array vacío
        setSelectedVendors([]);
      } else {
        // En modo creación, todos los vendedores seleccionados se agregan a la ruta
        setSelectedVendors([]);
        setAssignedVendors([]);
      }
    }
  }, [isOpen, isEditMode, currentRoute]);

  // Filtrar vendedores no asignados cuando cambian los vendedores disponibles o asignados
  useEffect(() => {
    if (availableVendors.length > 0) {
      // Convertir los IDs a números para comparación consistente
      const assignedVendorIds = assignedVendors.map(v => parseInt(v.id_vendedor));
      const selectedVendorIdsInt = selectedVendors.map(id => parseInt(id));
      
      // Filtramos los vendedores que no están asignados ni seleccionados
      const availableForSelection = availableVendors.filter(vendor => {
        const vendorId = parseInt(vendor.id_usuario);
        return !assignedVendorIds.includes(vendorId) && !selectedVendorIdsInt.includes(vendorId);
      });
      
      setUnassignedVendors(availableForSelection);
    }
  }, [availableVendors, assignedVendors, selectedVendors]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setDriverId('');
    setSelectedVendors([]);
    setAssignedVendors([]);
    setNewVendorId('');
    setOriginalDriverId('');
  };

  const fetchAvailableVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('ASSIGNMENTS', 'GET_VENDORS'));
      const data = await response.json();
      
      if (data.success) {
        console.log('Vendedores recibidos:', data.vendors);
        // Filtrar solo vendedores que tienen lugar de venta asignado
        const vendorsWithLocation = data.vendors.filter(v => v.id_lugarVenta);
        setAvailableVendors(vendorsWithLocation);
      } else {
        toast.error('Error al cargar los vendedores');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los vendedores');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = () => {
    if (!newVendorId) {
      toast.error('Selecciona un vendedor para agregar');
      return;
    }

    // Verificar que el vendedor no esté ya seleccionado
    if (selectedVendors.includes(newVendorId)) {
      toast.error('Este vendedor ya está seleccionado');
      return;
    }

    // Verificar que el vendedor no esté ya asignado a la ruta (en modo edición)
    if (isEditMode) {
      const vendorIdInt = parseInt(newVendorId);
      const isAlreadyAssigned = assignedVendors.some(v => parseInt(v.id_vendedor) === vendorIdInt);
      
      if (isAlreadyAssigned) {
        toast.error('Este vendedor ya está asignado a esta ruta');
        return;
      }
    }

    // Agregar vendedor a los seleccionados
    setSelectedVendors([...selectedVendors, newVendorId]);
    setNewVendorId(''); // Resetear el selector
  };

  const handleRemoveSelectedVendor = (vendorId) => {
    setSelectedVendors(selectedVendors.filter(id => id !== vendorId));
  };

  const handleRemoveAssignedVendor = async (vendorId) => {
    if (!isEditMode || !currentRoute) {
      toast.error('No se puede eliminar este vendedor');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(getApiUrl('ASSIGNMENTS', 'REMOVE_VENDOR_FROM_ROUTE'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_ruta: currentRoute.id_ruta,
          id_vendedor: vendorId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Actualizar el estado local para reflejar el cambio
        setAssignedVendors(assignedVendors.filter(v => v.id_vendedor !== vendorId));
        toast.success('Vendedor eliminado de la ruta');
      } else {
        toast.error(data.message || 'Error al eliminar el vendedor');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el vendedor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!driverId) {
      toast.error('Debes seleccionar un chofer');
      return;
    }

    // En modo edición, se pueden eliminar todos los vendedores de la ruta
    // pero se verifica que al menos quede uno si hay seleccionados o asignados
    if (!isEditMode && selectedVendors.length === 0) {
      toast.error('Debes seleccionar al menos un vendedor');
      return;
    }

    // Verificar si hay vendedores duplicados
    const uniqueVendors = new Set(selectedVendors);
    if (uniqueVendors.size !== selectedVendors.length) {
      toast.error('Hay vendedores seleccionados más de una vez');
      return;
    }

    // Obtenemos la fecha actual en formato YYYY-MM-DD para el servidor
    // Solo para nuevas rutas; en edición mantenemos la fecha original
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;

    // Preparar datos para enviar
    const routeData = {
      id_chofer: parseInt(driverId),
      fecha: isEditMode ? currentRoute.fecha : currentDate,
      vendedores: []
    };

    // En modo edición, incluir los vendedores que siguen asignados más los nuevos seleccionados
    if (isEditMode) {
      // Incluir el ID de la ruta en modo edición
      routeData.id_ruta = currentRoute.id_ruta;
      
      // Incluir los vendedores que ya están asignados (y no fueron eliminados)
      routeData.vendedores = [
        ...assignedVendors.map(vendor => parseInt(vendor.id_vendedor)),
        ...selectedVendors.map(id => parseInt(id))
      ];
    } else {
      // En modo creación, solo incluir los vendedores seleccionados
      routeData.vendedores = selectedVendors.map(id => parseInt(id));
    }

    const success = await onSave(routeData);
    if (success) {
      resetForm();
      onClose();
    }
  };

  // Obtener el nombre completo de un vendedor
  const getVendorName = (vendor) => {
    return `${vendor.nombre} ${vendor.apellido_p} ${vendor.apellido_m}`;
  };

  // Obtener el nombre del lugar de venta
  const getLocationName = (vendor) => {
    if (vendor.nombre_lugar) {
      return vendor.nombre_lugar;
    }
    return `Lugar ${vendor.id_lugarVenta}`;
  };

  if (!isOpen) return null;

  // Encontrar un vendedor por su ID
  const findVendorById = (vendorId) => {
    const vendorIdInt = parseInt(vendorId);
    return availableVendors.find(vendor => parseInt(vendor.id_usuario) === vendorIdInt);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditMode ? 'Editar Ruta de Chofer' : 'Crear Nueva Ruta de Chofer para Hoy'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Selección de chofer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chofer</label>
              <div className="relative">
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-md cursor-pointer"
                >
                  <option value="">Selecciona un chofer</option>
                  {drivers.map(driver => (
                    <option key={driver.id_usuario} value={driver.id_usuario}>
                      {`${driver.nombre} ${driver.apellido_p} ${driver.apellido_m}`}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <Truck className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              {isEditMode && driverId !== originalDriverId && (
                <p className="mt-1 text-xs text-red-500">
                  Advertencia: Cambiar el chofer podría causar conflictos si ya tiene una ruta asignada para hoy.
                </p>
              )}
            </div>

            {/* Sección de vendedores ya asignados (solo en modo edición) */}
            {isEditMode && assignedVendors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendedores Ya Asignados a esta Ruta ({assignedVendors.length})
                </label>
                <div className="border border-gray-200 rounded-md overflow-hidden mb-4">
                  <ul className="divide-y divide-gray-200 max-h-40 overflow-y-auto">
                    {assignedVendors.map(vendor => (
                      <li key={`assigned-${vendor.id_vendedor}`} className="p-3 flex justify-between items-center hover:bg-gray-50">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium">{`${vendor.nombre} ${vendor.apellido_p} ${vendor.apellido_m}`}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveAssignedVendor(vendor.id_vendedor)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                          title="Eliminar de la ruta"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Agregar nuevos vendedores */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agregar Nuevo Vendedor a la Ruta
              </label>
              <div className="flex gap-2">
                <select
                  value={newVendorId}
                  onChange={(e) => setNewVendorId(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-md cursor-pointer"
                >
                  <option value="">Selecciona un vendedor</option>
                  {unassignedVendors.map(vendor => (
                    <option key={vendor.id_usuario} value={vendor.id_usuario}>
                      {`${vendor.nombre} ${vendor.apellido_p} ${vendor.apellido_m} - ${getLocationName(vendor)}`}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddVendor}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center cursor-pointer"
                  disabled={!newVendorId}
                >
                  <Plus className="h-5 w-5 mr-1" /> Agregar
                </button>
              </div>
            </div>

            {/* Vendedores seleccionados para agregar - Solo visible si hay vendedores seleccionados */}
            {selectedVendors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendedores por Agregar ({selectedVendors.length})
                </label>
                <div className="border border-gray-200 rounded-md overflow-hidden mb-4">
                  <ul className="divide-y divide-gray-200 max-h-40 overflow-y-auto">
                    {selectedVendors.map(vendorId => {
                      const vendor = findVendorById(vendorId);
                      if (!vendor) return null;
                      
                      return (
                        <li key={`selected-${vendorId}`} className="p-3 flex justify-between items-center hover:bg-gray-50">
                          <div>
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium">{getVendorName(vendor)}</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Lugar de venta: {getLocationName(vendor)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveSelectedVendor(vendorId)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                            title="Quitar de la selección"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 cursor-pointer"
              >
                {isEditMode ? 'Actualizar Ruta' : 'Guardar Ruta'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

RouteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  drivers: PropTypes.arrayOf(
    PropTypes.shape({
      id_usuario: PropTypes.number.isRequired,
      nombre: PropTypes.string.isRequired,
      apellido_p: PropTypes.string.isRequired,
      apellido_m: PropTypes.string.isRequired
    })
  ).isRequired,
  currentRoute: PropTypes.object,
  isEditMode: PropTypes.bool
};

RouteModal.defaultProps = {
  currentRoute: null,
  isEditMode: false
};

export default RouteModal;