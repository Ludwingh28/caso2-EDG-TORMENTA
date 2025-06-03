<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

include '../../conexion.php';

class LocationStatusManager {
    private $conn;
    private $data;
    private $vendorsAffected = 0;
    
    public function __construct($connection, $requestData) {
        $this->conn = $connection;
        $this->data = $requestData;
    }
    
    public function toggleStatus() {
        try {
            $this->conn->begin_transaction();
            
            // Obtener el estado actual para determinar el nuevo estado
            $newStatus = $this->determineNewStatus();
            
            // Si estamos desactivando, primero liberamos los vendedores asociados
            if ($newStatus === 'desactivado') {
                $this->releaseVendors();
            }
            
            // Actualizar el estado del lugar de venta
            if ($this->updateLocationStatus($newStatus)) {
                $message = $this->generateSuccessMessage($newStatus);
                $this->conn->commit();
                return ['success' => true, 'message' => $message];
            } else {
                $this->conn->rollback();
                return ['success' => false, 'message' => 'No se pudo actualizar el estado del lugar'];
            }
        } catch (Exception $e) {
            $this->conn->rollback();
            return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }
    
    private function determineNewStatus() {
        return $this->data['currentStatus'] === 'desactivado' ? 'disponible' : 'desactivado';
    }
    
    private function releaseVendors() {
        // Actualizar la tabla vendedor para quitar la referencia al lugar de venta
        $updateVendorsQuery = "UPDATE vendedor SET id_lugarVenta = NULL WHERE id_lugarVenta = ?";
        $updateVendorsStmt = $this->conn->prepare($updateVendorsQuery);
        $updateVendorsStmt->bind_param("i", $this->data['locationId']);
        $updateVendorsStmt->execute();
        
        $this->vendorsAffected = $this->conn->affected_rows;
    }
    
    private function updateLocationStatus($newStatus) {
        $updateLocationQuery = "UPDATE lugarVenta SET estado = ? WHERE id_lugarVenta = ?";
        $updateLocationStmt = $this->conn->prepare($updateLocationQuery);
        $updateLocationStmt->bind_param("si", $newStatus, $this->data['locationId']);
        $updateLocationStmt->execute();
        
        return $updateLocationStmt->affected_rows > 0;
    }
    
    private function generateSuccessMessage($newStatus) {
        if ($newStatus === 'desactivado') {
            return $this->vendorsAffected > 0 
                ? "Lugar desactivado y {$this->vendorsAffected} vendedor(es) liberado(s)" 
                : "Lugar desactivado correctamente";
        } else {
            return "Lugar activado correctamente";
        }
    }
}

// Uso de la clase
$data = json_decode(file_get_contents('php://input'), true);
$statusManager = new LocationStatusManager($con, $data);
$response = $statusManager->toggleStatus();
echo json_encode($response);

$con->close();
?>