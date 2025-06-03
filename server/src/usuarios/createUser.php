<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

include '../../conexion.php';

class UserCreator {
    private $conn;
    private $userData;
    
    public function __construct($connection, $data) {
        $this->conn = $connection;
        $this->userData = $data;
    }
    
    public function create() {
        try {
            $this->conn->begin_transaction();
            
            // Verificar si el username ya existe
            if ($this->usernameExists()) {
                $this->conn->rollback();
                return ['success' => false, 'message' => 'El nombre de usuario ya existe'];
            }
            
            // Insertar en la tabla usuario
            $userId = $this->insertUserData();
            
            // Si el usuario es un vendedor, procesarlo
            if ($this->userData['role'] == '4') {
                $this->processVendor($userId);
            }
            
            $this->conn->commit();
            return ['success' => true, 'message' => 'Usuario creado exitosamente'];
            
        } catch (Exception $e) {
            $this->conn->rollback();
            return ['success' => false, 'message' => 'Error al crear usuario: ' . $e->getMessage()];
        }
    }
    
    private function usernameExists() {
        $checkQuery = "SELECT username FROM usuario WHERE username = ?";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bind_param("s", $this->userData['username']);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        return $result->num_rows > 0;
    }
    
    private function insertUserData() {
        $userQuery = "INSERT INTO usuario (nombre, apellido_p, apellido_m, username, password, id_rol, estado) VALUES (?, ?, ?, ?, ?, ?, 'activo')";
        $userStmt = $this->conn->prepare($userQuery);
        $userStmt->bind_param("sssssi", 
            $this->userData['nombre'], 
            $this->userData['apellido_p'], 
            $this->userData['apellido_m'], 
            $this->userData['username'], 
            $this->userData['password'], 
            $this->userData['role']
        );
        $userStmt->execute();
        
        return $this->conn->insert_id;
    }
    
    private function processVendor($userId) {
        // Insertar en la tabla vendedor
        $vendorQuery = "INSERT INTO vendedor (id_usuario, pin, id_lugarVenta) VALUES (?, ?, ?)";
        $vendorStmt = $this->conn->prepare($vendorQuery);
        $vendorStmt->bind_param("isi", $userId, $this->userData['pin'], $this->userData['location']);
        $vendorStmt->execute();
        
        // Actualizar el estado del lugar de venta
        $updateLocationQuery = "UPDATE lugarVenta SET estado = 'ocupado' WHERE id_lugarVenta = ?";
        $updateLocationStmt = $this->conn->prepare($updateLocationQuery);
        $updateLocationStmt->bind_param("i", $this->userData['location']);
        $updateLocationStmt->execute();
    }
}

// Uso de la clase
$data = json_decode(file_get_contents('php://input'), true);
$userCreator = new UserCreator($con, $data);
$response = $userCreator->create();
echo json_encode($response);

$con->close();
?>