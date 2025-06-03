<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include '../../conexion.php';

class VendorManager {
    private $conn;
    
    public function __construct($connection) {
        $this->conn = $connection;
    }
    
    public function getVendorInfo($userId) {
        if (!$userId) {
            return ['success' => false, 'message' => 'ID no proporcionado'];
        }
        
        try {
            $query = "SELECT pin FROM vendedor WHERE id_usuario = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                return ['success' => true, 'pin' => $row['pin']];
            } else {
                return ['success' => false, 'message' => 'Vendedor no encontrado'];
            }
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }
}

// Uso de la clase
$vendorManager = new VendorManager($con);
$userId = isset($_GET['id']) ? $_GET['id'] : null;
$response = $vendorManager->getVendorInfo($userId);
echo json_encode($response);

$con->close();
?>