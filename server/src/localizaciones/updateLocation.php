<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

include '../../conexion.php';

class LocationUpdater {
    private $conn;
    private $locationData;
    
    public function __construct($connection, $data) {
        $this->conn = $connection;
        $this->locationData = $data;
    }
    
    public function update() {
        try {
            $this->conn->begin_transaction();
            
            // Verificar que los datos requeridos existen
            if (!$this->validateRequiredData()) {
                throw new Exception('Datos incompletos');
            }
            
            // Actualizar el lugar de venta
            if ($this->updateLocationData()) {
                $this->conn->commit();
                return ['success' => true, 'message' => 'Lugar de venta actualizado correctamente'];
            } else {
                $this->conn->rollback();
                return ['success' => false, 'message' => 'No se pudo actualizar el lugar de venta'];
            }
        } catch (Exception $e) {
            $this->conn->rollback();
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }
    
    private function validateRequiredData() {
        return isset($this->locationData['id']) && 
               isset($this->locationData['nombre']) && 
               isset($this->locationData['latitud']) && 
               isset($this->locationData['longitud']);
    }
    
    private function updateLocationData() {
        $query = "UPDATE lugarVenta SET nombre = ?, latitud = ?, longitud = ? WHERE id_lugarVenta = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("sddi", 
            $this->locationData['nombre'], 
            $this->locationData['latitud'], 
            $this->locationData['longitud'], 
            $this->locationData['id']
        );
        $stmt->execute();
        
        return $stmt->affected_rows > 0;
    }
}

// Uso de la clase
$data = json_decode(file_get_contents('php://input'), true);
$locationUpdater = new LocationUpdater($con, $data);
$response = $locationUpdater->update();
echo json_encode($response);

$con->close();
?>