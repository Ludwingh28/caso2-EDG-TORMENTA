<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

include '../conexion.php';

class Auth {
    private $con;

    public function __construct($dbConnection) {
        $this->con = $dbConnection;
    }

    public function login($username, $password) {
        $query = "SELECT u.*, r.id_rol FROM usuario u 
                  INNER JOIN rol r ON u.id_rol = r.id_rol 
                  WHERE u.username = ?";
        
        $stmt = $this->con->prepare($query);
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            
            if ($password === $user['password']) {
                if ($user['estado'] === 'activo') {
                    return json_encode([
                        'success' => true,
                        'rol' => $user['id_rol']
                    ]);
                } else {
                    return json_encode([
                        'success' => false,
                        'message' => 'Usuario desactivado'
                    ]);
                }
            } else {
                return json_encode([
                    'success' => false,
                    'message' => 'Contraseña incorrecta'
                ]);
            }
        } else {
            return json_encode([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ]);
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'];
    $password = $_POST['password'];
    
    $auth = new Auth($con);
    echo $auth->login($username, $password);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
}

$con->close();
