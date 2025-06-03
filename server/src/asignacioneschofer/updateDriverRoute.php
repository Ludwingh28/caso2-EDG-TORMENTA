<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

include '../../conexion.php';

// Si es una solicitud OPTIONS (preflight), simplemente responder con éxito
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class RouteUpdater {
    private $conn;
    private $data;
    private $routeData;
    
    public function __construct($connection, $routeData) {
        $this->conn = $connection;
        $this->data = $routeData;
    }
    
    public function updateRoute() {
        try {
            // Validar datos requeridos
            if (!$this->validateData()) {
                return [
                    'success' => false,
                    'message' => 'Datos incompletos. Se requiere id_ruta e id_chofer.'
                ];
            }
            
            // Verificar si la ruta existe y obtener sus datos actuales
            if (!$this->checkRouteExists()) {
                return [
                    'success' => false,
                    'message' => 'La ruta especificada no existe'
                ];
            }
            
            // Si el chofer ha cambiado, verificar que no tenga otra ruta asignada para esa fecha
            if ($this->driverChanged() && $this->driverHasAnotherRouteForDate()) {
                return [
                    'success' => false,
                    'message' => 'El chofer seleccionado ya tiene una ruta asignada para esta fecha'
                ];
            }
            
            // Iniciar una transacción
            $this->conn->begin_transaction();
            
            // Actualizar la información de la ruta y los vendedores
            $this->updateRouteInfo();
            
            // Confirmar la transacción
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Ruta actualizada exitosamente'
            ];
            
        } catch (Exception $e) {
            // Revertir la transacción en caso de error
            $this->conn->rollback();
            
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
    }
    
    private function validateData() {
        return isset($this->data['id_ruta']) && isset($this->data['id_chofer']);
    }
    
    private function checkRouteExists() {
        $checkRouteQuery = "SELECT id_ruta, id_chofer, fecha FROM ruta_chofer WHERE id_ruta = ?";
        $checkStmt = $this->conn->prepare($checkRouteQuery);
        $checkStmt->bind_param("i", $this->data['id_ruta']);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            return false;
        }
        
        $this->routeData = $checkResult->fetch_assoc();
        return true;
    }
    
    private function driverChanged() {
        return $this->routeData['id_chofer'] != $this->data['id_chofer'];
    }
    
    private function driverHasAnotherRouteForDate() {
        $checkDriverQuery = "SELECT id_ruta FROM ruta_chofer WHERE id_chofer = ? AND fecha = ? AND id_ruta != ?";
        $checkDriverStmt = $this->conn->prepare($checkDriverQuery);
        $checkDriverStmt->bind_param("isi", 
            $this->data['id_chofer'], 
            $this->routeData['fecha'], 
            $this->data['id_ruta']
        );
        $checkDriverStmt->execute();
        $checkDriverResult = $checkDriverStmt->get_result();
        
        return $checkDriverResult->num_rows > 0;
    }
    
    private function updateRouteInfo() {
        // Actualizar la información del chofer de la ruta
        $this->updateRouteDriver();
        
        // Si hay vendedores para asignar, actualizar las asignaciones
        if (isset($this->data['vendedores'])) {
            $this->updateRouteVendors();
        }
    }
    
    private function updateRouteDriver() {
        $updateRouteQuery = "UPDATE ruta_chofer SET id_chofer = ? WHERE id_ruta = ?";
        $stmtRoute = $this->conn->prepare($updateRouteQuery);
        $stmtRoute->bind_param("ii", $this->data['id_chofer'], $this->data['id_ruta']);
        
        if (!$stmtRoute->execute()) {
            throw new Exception("Error al actualizar la ruta: " . $this->conn->error);
        }
    }
    
    private function updateRouteVendors() {
        // Eliminar todas las asignaciones actuales
        $this->removeCurrentVendors();
        
        // Insertar los nuevos vendedores
        if (!empty($this->data['vendedores'])) {
            $this->assignNewVendors();
        }
    }
    
    private function removeCurrentVendors() {
        $deleteVendorsQuery = "DELETE FROM ruta_chofer_vendedor WHERE id_ruta = ?";
        $stmtDeleteVendors = $this->conn->prepare($deleteVendorsQuery);
        $stmtDeleteVendors->bind_param("i", $this->data['id_ruta']);
        
        if (!$stmtDeleteVendors->execute()) {
            throw new Exception("Error al eliminar vendedores actuales: " . $this->conn->error);
        }
    }
    
    private function assignNewVendors() {
        $insertVendorQuery = "INSERT INTO ruta_chofer_vendedor (id_ruta, id_vendedor) VALUES (?, ?)";
        $stmtVendor = $this->conn->prepare($insertVendorQuery);
        
        foreach ($this->data['vendedores'] as $vendorId) {
            $stmtVendor->bind_param("ii", $this->data['id_ruta'], $vendorId);
            
            if (!$stmtVendor->execute()) {
                throw new Exception("Error al asignar vendedor: " . $this->conn->error);
            }
        }
    }
}

// Uso de la clase
$data = json_decode(file_get_contents('php://input'), true);
$routeUpdater = new RouteUpdater($con, $data);
$response = $routeUpdater->updateRoute();
echo json_encode($response);

$con->close();
?>