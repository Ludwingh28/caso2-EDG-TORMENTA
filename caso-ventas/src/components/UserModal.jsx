import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'sonner';
import { User } from 'lucide-react';
import { getApiUrl } from '../Config/Config';

const UserModal = ({ isOpen, onClose, user = null }) => {
  const initialFormData = {
    username: '',
    password: '',
    nombre: '',
    apellido_p: '',
    apellido_m: '',
    role: '',
    pin: '',
    location: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isVendor, setIsVendor] = useState(false);
  const [roles, setRoles] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (user) {
        // Si es edición, cargar datos del usuario
        const fetchVendorData = async () => {
          try {
            
            const response = await fetch(getApiUrl('USERS', 'GET_VENDOR_INFO') + `?id=${user.id_usuario}`);
            const data = await response.json();
            
            setFormData({
              username: user.username,
              password: '',
              nombre: user.nombre,
              apellido_p: user.apellido_p,
              apellido_m: user.apellido_m,
              role: user.id_rol,
              pin: data.success ? data.pin : '',
              location: user.id_lugarVenta || '',
            });
          } catch (error) {
            console.error('Error:', error);
            setFormData({
              username: user.username,
              password: '',
              nombre: user.nombre,
              apellido_p: user.apellido_p,
              apellido_m: user.apellido_m,
              role: user.id_rol,
              pin: '',
              location: user.id_lugarVenta || '',
            });
          }
        };

        if (user.id_rol === '4') {
          fetchVendorData();
        } else {
          setFormData({
            username: user.username,
            password: '',
            nombre: user.nombre,
            apellido_p: user.apellido_p,
            apellido_m: user.apellido_m,
            role: user.id_rol,
            pin: '',
            location: '',
          });
        }
        setIsVendor(user.id_rol === '4');
      } else {
        // Si es creación, limpiar el formulario
        setFormData(initialFormData);
        setIsVendor(false);
      }

      // Obtener roles y ubicaciones
      fetch(getApiUrl('ROLES_LOCATIONS', 'GET_ROLES_AND_LOCATIONS'))
        .then(response => response.json())
        .then(data => {
          setRoles(data.roles);
          setLocations(data.locations);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
          toast.error('Error al cargar los datos');
        });
    }
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validar PIN: solo números y máximo 4 dígitos
    if (name === 'pin') {
      if (!/^\d*$/.test(value) || value.length > 4) return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'role') {
      setIsVendor(value === '4');
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setIsVendor(false);
    onClose(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = user 
        ? getApiUrl('USERS', 'UPDATE_USER')
        : getApiUrl('USERS', 'CREATE_USER');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id_usuario: user?.id_usuario
        }),
      });


      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        handleClose(); // Usar handleClose para limpiar el formulario
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar la operación');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {user ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de Usuario
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required={!user}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido Paterno
            </label>
            <input
              type="text"
              name="apellido_p"
              value={formData.apellido_p}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido Materno
            </label>
            <input
              type="text"
              name="apellido_m"
              value={formData.apellido_m}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Seleccionar rol</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.nombre}
                </option>
              ))}
            </select>
          </div>

          {isVendor && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN
                </label>
                <input
                  type="text"
                  name="pin"
                  value={formData.pin}
                  onChange={handleChange}
                  maxLength="4"
                  pattern="\d{4}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación de Venta
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Seleccionar ubicación</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors cursor-pointer"
          >
            {user ? 'Actualizar Usuario' : 'Crear Usuario'}
          </button>
        </form>
      </div>
    </div>
  );
};

UserModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    user: PropTypes.shape({
      id_usuario: PropTypes.number,
      username: PropTypes.string,
      nombre: PropTypes.string,
      apellido_p: PropTypes.string,
      apellido_m: PropTypes.string,
      id_rol: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      id_lugarVenta: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  };

export default UserModal;