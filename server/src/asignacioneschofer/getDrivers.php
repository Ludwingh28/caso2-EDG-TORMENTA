<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

include '../../conexion.php';

class DriverManager {
    private $conn;
    
    public function __construct($connection) {
        $this->conn = $connection;
    }
    
    public function getAllActiveDrivers() {
        try {
            // Obtenemos todos los usuarios con rol de chofer (id_rol = 3)
            $query = "SELECT u.id_usuario, u.nombre, u.apellido_p, u.apellido_m, u.username, u.estado 
                    FROM usuario u 
                    WHERE u.id_rol = 3 AND u.estado = 'activo'";
            
            $result = $this->conn->query($query);
            
            if (!$result) {
                throw new Exception("Error en la consulta: " . $this->conn->error);
            }
            
            $drivers = [];
            
            while ($row = $result->fetch_assoc()) {
                $drivers[] = $row;
            }
            
            return ['success' => true, 'drivers' => $drivers];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }
}

// Uso de la clase
$driverManager = new DriverManager($con);
$response = $driverManager->getAllActiveDrivers();
echo json_encode($response);

$con->close();
?>