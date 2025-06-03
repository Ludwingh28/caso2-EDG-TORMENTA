<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

include '../../conexion.php';

class LocationCreator {
    private $conn;
    private $locationData;
    
    public function __construct($connection, $data) {
        $this->conn = $connection;
        $this->locationData = $data;
    }
    
    public function create() {
        try {
            $this->conn->begin_transaction();
            
            // Verificar que los datos requeridos existen
            if (!$this->validateRequiredData()) {
                throw new Exception('Datos incompletos');
            }
            
            // Verificar si el nombre ya existe
            if ($this->checkNameExists()) {
                throw new Exception('El nombre del lugar ya existe');
            }
            
            // Insertar el nuevo lugar de venta
            $newId = $this->insertLocation();
            
            if ($newId) {
                $this->conn->commit();
                return [
                    'success' => true, 
                    'message' => 'Lugar de venta creado correctamente',
                    'id' => $newId
                ];
            } else {
                $this->conn->rollback();
                return ['success' => false, 'message' => 'No se pudo crear el lugar de venta'];
            }
        } catch (Exception $e) {
            $this->conn->rollback();
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }
    
    private function validateRequiredData() {
        return isset($this->locationData['nombre']) && 
               isset($this->locationData['latitud']) && 
               isset($this->locationData['longitud']);
    }
    
    private function checkNameExists() {
        $checkQuery = "SELECT COUNT(*) as count FROM lugarVenta WHERE LOWER(nombre) = LOWER(?)";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bind_param("s", $this->locationData['nombre']);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        $count = $checkResult->fetch_assoc()['count'];
        
        return $count > 0;
    }
    
    private function insertLocation() {
        $query = "INSERT INTO lugarVenta (nombre, latitud, longitud, estado) VALUES (?, ?, ?, 'disponible')";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("sdd", 
            $this->locationData['nombre'], 
            $this->locationData['latitud'], 
            $this->locationData['longitud']
        );
        $stmt->execute();
        
        if ($stmt->affected_rows > 0) {
            return $this->conn->insert_id;
        }
        
        return false;
    }
}

// Uso de la clase
$data = json_decode(file_get_contents('php://input'), true);
$locationCreator = new LocationCreator($con, $data);
$response = $locationCreator->create();
echo json_encode($response);

$con->close();
?>