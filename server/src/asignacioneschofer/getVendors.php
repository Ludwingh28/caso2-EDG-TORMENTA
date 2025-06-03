<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

include '../../conexion.php';

try {
    // Obtenemos todos los vendedores (usuarios con la tabla vendedor relacionada)
    $query = "SELECT u.id_usuario, u.nombre, u.apellido_p, u.apellido_m, u.username, u.estado, v.pin, v.id_lugarVenta 
              FROM usuario u 
              JOIN vendedor v ON u.id_usuario = v.id_usuario
              WHERE u.estado = 'activo'";
    
    $result = $con->query($query);
    
    if (!$result) {
        throw new Exception("Error en la consulta: " . $con->error);
    }
    
    $vendors = [];
    
    while ($row = $result->fetch_assoc()) {
        $vendors[] = $row;
    }
    
    echo json_encode(['success' => true, 'vendors' => $vendors]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

$con->close();
?>