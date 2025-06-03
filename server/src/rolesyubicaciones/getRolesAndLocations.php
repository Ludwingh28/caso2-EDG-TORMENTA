<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include '../../conexion.php';

class RolesAndLocationsManager {
    private $conn;
    
    public function __construct($connection) {
        $this->conn = $connection;
    }
    
    public function getData() {
        try {
            return [
                'roles' => $this->getRoles(),
                'locations' => $this->getAvailableLocations()
            ];
        } catch (Exception $e) {
            return ['error' => 'Error al obtener datos: ' . $e->getMessage()];
        }
    }
    
    private function getRoles() {
        $rolesQuery = "SELECT id_rol, nombre FROM rol";
        $rolesResult = $this->conn->query($rolesQuery);
        
        if (!$rolesResult) {
            throw new Exception("Error al obtener roles: " . $this->conn->error);
        }
        
        $roles = [];
        while($row = $rolesResult->fetch_assoc()) {
            $roles[] = [
                'id' => $row['id_rol'],
                'nombre' => $row['nombre']
            ];
        }
        
        return $roles;
    }
    
    private function getAvailableLocations() {
        $locationsQuery = "SELECT id_lugarVenta, nombre FROM lugarVenta WHERE estado = 'disponible'";
        $locationsResult = $this->conn->query($locationsQuery);
        
        if (!$locationsResult) {
            throw new Exception("Error al obtener ubicaciones: " . $this->conn->error);
        }
        
        $locations = [];
        while($row = $locationsResult->fetch_assoc()) {
            $locations[] = [
                'id' => $row['id_lugarVenta'],
                'nombre' => $row['nombre']
            ];
        }
        
        return $locations;
    }
}

// Uso de la clase
$manager = new RolesAndLocationsManager($con);
$response = $manager->getData();
echo json_encode($response);

$con->close();
?>