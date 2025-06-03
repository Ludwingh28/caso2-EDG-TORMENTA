<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

include '../../conexion.php';

class UserStatusManager {
    private $conn;
    private $data;
    
    public function __construct($connection, $requestData) {
        $this->conn = $connection;
        $this->data = $requestData;
    }
    
    public function toggleStatus() {
        try {
            $this->conn->begin_transaction();
            
            $newStatus = $this->data['currentStatus'] === 'activo' ? 'desactivado' : 'activo';
            
            // Actualizar estado del usuario
            $this->updateUserStatus($newStatus);
            
            // Si el usuario está siendo desactivado y es vendedor, liberar el lugar de venta
            if ($newStatus === 'desactivado' && $this->data['isVendor']) {
                $this->releaseVendorLocation();
            }
            
            $this->conn->commit();
            return [
                'success' => true,
                'message' => 'Estado del usuario actualizado correctamente'
            ];
            
        } catch (Exception $e) {
            $this->conn->rollback();
            return [
                'success' => false,
                'message' => 'Error al actualizar el estado: ' . $e->getMessage()
            ];
        }
    }
    
    private function updateUserStatus($newStatus) {
        $updateQuery = "UPDATE usuario SET estado = ? WHERE id_usuario = ?";
        $stmt = $this->conn->prepare($updateQuery);
        $stmt->bind_param("si", $newStatus, $this->data['userId']);
        $stmt->execute();
    }
    
    private function releaseVendorLocation() {
        // Obtener el id_lugarVenta actual
        $lugarVentaId = $this->getVendorLocationId();
        
        if ($lugarVentaId) {
            // Actualizar el estado del lugar de venta a disponible
            $this->setLocationAvailable($lugarVentaId);
            
            // Actualizar vendedor para quitar la ubicación
            $this->removeVendorLocation();
        }
    }
    
    private function getVendorLocationId() {
        $getLocationQuery = "SELECT id_lugarVenta FROM vendedor WHERE id_usuario = ?";
        $locationStmt = $this->conn->prepare($getLocationQuery);
        $locationStmt->bind_param("i", $this->data['userId']);
        $locationStmt->execute();
        $result = $locationStmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            return $row['id_lugarVenta'];
        }
        
        return null;
    }
    
    private function setLocationAvailable($locationId) {
        $updateLocationQuery = "UPDATE lugarVenta SET estado = 'disponible' WHERE id_lugarVenta = ?";
        $updateLocationStmt = $this->conn->prepare($updateLocationQuery);
        $updateLocationStmt->bind_param("i", $locationId);
        $updateLocationStmt->execute();
    }
    
    private function removeVendorLocation() {
        $updateVendorQuery = "UPDATE vendedor SET id_lugarVenta = NULL WHERE id_usuario = ?";
        $updateVendorStmt = $this->conn->prepare($updateVendorQuery);
        $updateVendorStmt->bind_param("i", $this->data['userId']);
        $updateVendorStmt->execute();
    }
}

// Uso de la clase
$data = json_decode(file_get_contents('php://input'), true);
$statusManager = new UserStatusManager($con, $data);
$response = $statusManager->toggleStatus();
echo json_encode($response);

$con->close();
?>