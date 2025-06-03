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

class VendorRouteManager {
    private $conn;
    private $data;
    
    public function __construct($connection, $requestData) {
        $this->conn = $connection;
        $this->data = $requestData;
    }
    
    public function removeVendorFromRoute() {
        try {
            // Validar datos requeridos
            if (!$this->validateData()) {
                return [
                    'success' => false,
                    'message' => 'Datos incompletos. Se requiere id_ruta e id_vendedor.'
                ];
            }
            
            // Eliminar el vendedor de la ruta
            if ($this->removeVendor()) {
                return [
                    'success' => true,
                    'message' => 'Vendedor eliminado de la ruta exitosamente'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'No se encontró el vendedor en esta ruta'
                ];
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
    }
    
    private function validateData() {
        return isset($this->data['id_ruta']) && isset($this->data['id_vendedor']);
    }
    
    private function removeVendor() {
        $deleteQuery = "DELETE FROM ruta_chofer_vendedor WHERE id_ruta = ? AND id_vendedor = ?";
        $stmt = $this->conn->prepare($deleteQuery);
        $stmt->bind_param("ii", $this->data['id_ruta'], $this->data['id_vendedor']);
        
        if (!$stmt->execute()) {
            throw new Exception("Error al eliminar el vendedor de la ruta: " . $this->conn->error);
        }
        
        return $stmt->affected_rows > 0;
    }
}

// Uso de la clase
$data = json_decode(file_get_contents('php://input'), true);
$vendorRouteManager = new VendorRouteManager($con, $data);
$response = $vendorRouteManager->removeVendorFromRoute();
echo json_encode($response);

$con->close();
?>