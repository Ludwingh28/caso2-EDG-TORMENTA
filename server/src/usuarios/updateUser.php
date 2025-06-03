<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

include '../../conexion.php';

class UserUpdater {
    private $conn;
    private $userData;
    
    public function __construct($connection, $data) {
        $this->conn = $connection;
        $this->userData = $data;
    }
    
    public function update() {
        try {
            $this->conn->begin_transaction();
            
            // Verificar si el username ya existe para otro usuario
            if ($this->usernameExistsForOtherUser()) {
                $this->conn->rollback();
                return ['success' => false, 'message' => 'El nombre de usuario ya existe'];
            }
            
            // Actualizar información básica del usuario
            $this->updateBasicInfo();
            
            // Manejar rol de vendedor
            if ($this->userData['role'] == '4') {
                $this->handleVendorRole();
            } else {
                $this->removeVendorRole();
            }
            
            $this->conn->commit();
            return ['success' => true, 'message' => 'Usuario actualizado exitosamente'];
            
        } catch (Exception $e) {
            $this->conn->rollback();
            return ['success' => false, 'message' => 'Error al actualizar usuario: ' . $e->getMessage()];
        }
    }
    
    private function usernameExistsForOtherUser() {
        $checkQuery = "SELECT username FROM usuario WHERE username = ? AND id_usuario != ?";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bind_param("si", $this->userData['username'], $this->userData['id_usuario']);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        return $result->num_rows > 0;
    }
    
    private function updateBasicInfo() {
        if (!empty($this->userData['password'])) {
            $userQuery = "UPDATE usuario SET nombre = ?, apellido_p = ?, apellido_m = ?, username = ?, password = ?, id_rol = ? WHERE id_usuario = ?";
            $userStmt = $this->conn->prepare($userQuery);
            $userStmt->bind_param("sssssii", 
                $this->userData['nombre'], 
                $this->userData['apellido_p'], 
                $this->userData['apellido_m'], 
                $this->userData['username'], 
                $this->userData['password'], 
                $this->userData['role'], 
                $this->userData['id_usuario']
            );
        } else {
            $userQuery = "UPDATE usuario SET nombre = ?, apellido_p = ?, apellido_m = ?, username = ?, id_rol = ? WHERE id_usuario = ?";
            $userStmt = $this->conn->prepare($userQuery);
            $userStmt->bind_param("ssssii", 
                $this->userData['nombre'], 
                $this->userData['apellido_p'], 
                $this->userData['apellido_m'], 
                $this->userData['username'], 
                $this->userData['role'], 
                $this->userData['id_usuario']
            );
        }
        $userStmt->execute();
    }
    
    private function handleVendorRole() {
        // Verificar si ya existe como vendedor
        $checkVendorQuery = "SELECT id_usuario FROM vendedor WHERE id_usuario = ?";
        $checkVendorStmt = $this->conn->prepare($checkVendorQuery);
        $checkVendorStmt->bind_param("i", $this->userData['id_usuario']);
        $checkVendorStmt->execute();
        $vendorResult = $checkVendorStmt->get_result();

        if ($vendorResult->num_rows > 0) {
            // Actualizar vendedor existente
            $vendorQuery = "UPDATE vendedor SET pin = ?, id_lugarVenta = ? WHERE id_usuario = ?";
            $vendorStmt = $this->conn->prepare($vendorQuery);
            $vendorStmt->bind_param("sii", $this->userData['pin'], $this->userData['location'], $this->userData['id_usuario']);
        } else {
            // Insertar nuevo vendedor
            $vendorQuery = "INSERT INTO vendedor (id_usuario, pin, id_lugarVenta) VALUES (?, ?, ?)";
            $vendorStmt = $this->conn->prepare($vendorQuery);
            $vendorStmt->bind_param("isi", $this->userData['id_usuario'], $this->userData['pin'], $this->userData['location']);
        }
        $vendorStmt->execute();

        // Actualizar el estado del lugar de venta
        $updateLocationQuery = "UPDATE lugarVenta SET estado = 'ocupado' WHERE id_lugarVenta = ?";
        $updateLocationStmt = $this->conn->prepare($updateLocationQuery);
        $updateLocationStmt->bind_param("i", $this->userData['location']);
        $updateLocationStmt->execute();
    }
    
    private function removeVendorRole() {
        // Si el usuario ya no es vendedor pero lo era antes, eliminar el registro de vendedor
        $deleteVendorQuery = "DELETE FROM vendedor WHERE id_usuario = ?";
        $deleteVendorStmt = $this->conn->prepare($deleteVendorQuery);
        $deleteVendorStmt->bind_param("i", $this->userData['id_usuario']);
        $deleteVendorStmt->execute();

        // Liberar el lugar de venta si existía
        $updateLocationQuery = "UPDATE lugarVenta SET estado = 'disponible' WHERE id_lugarVenta IN (SELECT id_lugarVenta FROM vendedor WHERE id_usuario = ?)";
        $updateLocationStmt = $this->conn->prepare($updateLocationQuery);
        $updateLocationStmt->bind_param("i", $this->userData['id_usuario']);
        $updateLocationStmt->execute();
    }
}

// Uso de la clase
$data = json_decode(file_get_contents('php://input'), true);
$userUpdater = new UserUpdater($con, $data);
$response = $userUpdater->update();
echo json_encode($response);

$con->close();
?>