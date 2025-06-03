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

class RouteCreator {
    private $conn;
    private $data;
    
    public function __construct($connection, $routeData) {
        $this->conn = $connection;
        $this->data = $routeData;
    }
    
    public function createRoute() {
        try {
            // Validar datos requeridos
            if (!$this->validateData()) {
                return [
                    'success' => false,
                    'message' => 'Datos incompletos. Se requiere id_chofer, fecha y al menos un vendedor.'
                ];
            }
            
            // Verificar si el chofer ya tiene una ruta asignada para la fecha dada
            if ($this->driverHasRouteForDate()) {
                return [
                    'success' => false,
                    'message' => 'Este chofer ya tiene una ruta asignada para el día de hoy.'
                ];
            }
            
            // Iniciar una transacción
            $this->conn->begin_transaction();
            
            // Insertar la ruta y los vendedores
            $routeId = $this->insertRouteAndVendors();
            
            // Confirmar la transacción
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Ruta creada exitosamente',
                'id_ruta' => $routeId
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
        return isset($this->data['id_chofer']) && 
               isset($this->data['fecha']) && 
               isset($this->data['vendedores']) && 
               !empty($this->data['vendedores']);
    }
    
    private function driverHasRouteForDate() {
        $checkQuery = "SELECT id_ruta FROM ruta_chofer WHERE id_chofer = ? AND fecha = ?";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bind_param("is", $this->data['id_chofer'], $this->data['fecha']);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        return $checkResult->num_rows > 0;
    }
    
    private function insertRouteAndVendors() {
        // Insertar la ruta del chofer
        $insertRouteQuery = "INSERT INTO ruta_chofer (id_chofer, fecha) VALUES (?, ?)";
        $stmtRoute = $this->conn->prepare($insertRouteQuery);
        $stmtRoute->bind_param("is", $this->data['id_chofer'], $this->data['fecha']);
        
        if (!$stmtRoute->execute()) {
            throw new Exception("Error al crear la ruta: " . $this->conn->error);
        }
        
        // Obtener el ID de la ruta recién creada
        $routeId = $this->conn->insert_id;
        
        // Insertar los vendedores en la tabla ruta_chofer_vendedor
        $this->assignVendorsToRoute($routeId);
        
        return $routeId;
    }
    
    private function assignVendorsToRoute($routeId) {
        $insertVendorQuery = "INSERT INTO ruta_chofer_vendedor (id_ruta, id_vendedor) VALUES (?, ?)";
        $stmtVendor = $this->conn->prepare($insertVendorQuery);
        
        foreach ($this->data['vendedores'] as $vendorId) {
            $stmtVendor->bind_param("ii", $routeId, $vendorId);
            
            if (!$stmtVendor->execute()) {
                throw new Exception("Error al asignar vendedor: " . $this->conn->error);
            }
        }
    }
}

// Uso de la clase
$data = json_decode(file_get_contents('php://input'), true);
$routeCreator = new RouteCreator($con, $data);
$response = $routeCreator->createRoute();
echo json_encode($response);

$con->close();
?>