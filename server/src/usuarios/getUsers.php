<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Content-Type: application/json');

include '../../conexion.php';

class UserManager {
    private $conn;
    
    public function __construct($connection) {
        $this->conn = $connection;
    }
    
    public function getAllUsers() {
        try {
            $query = "SELECT u.*, r.nombre as rol_nombre, 
                    CASE WHEN v.id_usuario IS NOT NULL THEN 1 ELSE 0 END as is_vendor
                    FROM usuario u 
                    LEFT JOIN rol r ON u.id_rol = r.id_rol
                    LEFT JOIN vendedor v ON u.id_usuario = v.id_usuario";
            
            $result = $this->conn->query($query);
            
            if ($result) {
                $users = array();
                while ($row = $result->fetch_assoc()) {
                    $users[] = $row;
                }
                return ['success' => true, 'users' => $users];
            } else {
                return ['success' => false, 'message' => 'Error al obtener usuarios'];
            }
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }
}

// Uso de la clase
$userManager = new UserManager($con);
$response = $userManager->getAllUsers();
echo json_encode($response);

$con->close();
?>