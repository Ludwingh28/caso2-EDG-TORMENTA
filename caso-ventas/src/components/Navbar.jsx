import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, UserPlus, Layout, Map, Route } from 'lucide-react';

const Navbar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg cursor-pointer"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col p-4 space-y-4 mt-16">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-600'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <Layout size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-600'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <UserPlus size={20} />
            <span>Gestion de usuarios</span>
          </NavLink>

          <NavLink
            to="/maps"
            className={({ isActive }) =>
              `flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-600'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <Map size={20} />
            <span>Gestion de mapas</span>
          </NavLink>
          <NavLink
            to="/driver"
            className={({ isActive }) =>
              `flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-600'
                  : 'hover:bg-gray-100 text-gray-700'
              }`
            }
          >
            <Route size={20} />
            <span>Gestion de Rutas</span>
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default Navbar;