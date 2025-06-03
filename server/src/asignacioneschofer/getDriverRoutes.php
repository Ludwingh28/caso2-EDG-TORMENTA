<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

include '../../conexion.php';

class DriverRouteManager {
    private $conn;
    
    public function __construct($connection) {
        $this->conn = $connection;
    }
    
    public function getAllRoutes() {
        try {
            // Obtenemos todas las rutas de choferes
            $routes = $this->fetchAllRoutes();
            
            // Para cada ruta, obtenemos los vendedores asignados
            foreach ($routes as &$route) {
                $route['vendedores'] = $this->getVendorsForRoute($route['id_ruta']);
            }
            
            return ['success' => true, 'routes' => $routes];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }
    
    private function fetchAllRoutes() {
        $query = "SELECT rc.id_ruta, rc.id_chofer, rc.fecha FROM ruta_chofer rc ORDER BY rc.fecha DESC";
        $result = $this->conn->query($query);
        
        if (!$result) {
            throw new Exception("Error en la consulta: " . $this->conn->error);
        }
        
        $routes = [];
        while ($row = $result->fetch_assoc()) {
            $routes[] = [
                'id_ruta' => $row['id_ruta'],
                'id_chofer' => $row['id_chofer'],
                'fecha' => $row['fecha']
            ];
        }
        
        return $routes;
    }
    
    private function getVendorsForRoute($routeId) {
        $vendorQuery = "
            SELECT rcv.id_vendedor, u.nombre, u.apellido_p, u.apellido_m 
            FROM ruta_chofer_vendedor rcv 
            JOIN vendedor v ON rcv.id_vendedor = v.id_usuario
            JOIN usuario u ON v.id_usuario = u.id_usuario
            WHERE rcv.id_ruta = ?";
            
        $stmt = $this->conn->prepare($vendorQuery);
        $stmt->bind_param("i", $routeId);
        $stmt->execute();
        $vendorResult = $stmt->get_result();
        
        $vendedores = [];
        while ($vendorRow = $vendorResult->fetch_assoc()) {
            $vendedores[] = [
                'id_vendedor' => $vendorRow['id_vendedor'],
                'nombre' => $vendorRow['nombre'],
                'apellido_p' => $vendorRow['apellido_p'],
                'apellido_m' => $vendorRow['apellido_m']
            ];
        }
        
        return $vendedores;
    }
}

// Uso de la clase
$routeManager = new DriverRouteManager($con);
$response = $routeManager->getAllRoutes();
echo json_encode($response);

$con->close();
?>