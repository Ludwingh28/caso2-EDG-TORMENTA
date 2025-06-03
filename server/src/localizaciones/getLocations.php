<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

include '../../conexion.php';

class LocationManager {
    private $conn;
    
    public function __construct($connection) {
        $this->conn = $connection;
    }
    
    public function getAllLocations() {
        try {
            $query = "SELECT id_lugarVenta, nombre, latitud, longitud, estado FROM lugarVenta ORDER BY nombre";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $locations = [];
            while ($row = $result->fetch_assoc()) {
                $locations[] = $row;
            }
            
            return ['success' => true, 'locations' => $locations];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }
}

// Uso de la clase
$locationManager = new LocationManager($con);
$response = $locationManager->getAllLocations();
echo json_encode($response);

$con->close();
?>