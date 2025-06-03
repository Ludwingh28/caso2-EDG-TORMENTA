<?php
/**
 * Clase para manejar la conexión a la base de datos usando el patrón singleton
 */
class Database {
    private static $instance = null;
    private $connection;
    
    // Datos de conexión a la BD
    private $host = "localhost";
    private $user = "root";
    private $password = "lhj2807";
    private $db = "tormenta_db";
    
    /**
     * Constructor privado para evitar crear instancias directamente
     */
    private function __construct() {
        try {
            $this->connection = new mysqli($this->host, $this->user, $this->password, $this->db);
            
            // Verificar conexión
            if ($this->connection->connect_error) {
                throw new Exception("Error en la conexión: " . $this->connection->connect_error);
            }
            
            // Establecer juego de caracteres a utf8
            $this->connection->set_charset("utf8");
            
        } catch (Exception $e) {
            die("Error de conexión: " . $e->getMessage());
        }
    }
    
    /**
     * Obtener la instancia única de la clase
     * @return Database
     */
    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }
    
    /**
     * Obtener la conexión a la base de datos
     * @return mysqli
     */
    public function getConnection() {
        return $this->connection;
    }
    
    /**
     * Prevenir clonación de la instancia
     */
    private function __clone() {}
    
    /**
     * Cerrar la conexión a la base de datos
     */
    public function closeConnection() {
        if ($this->connection) {
            $this->connection->close();
            $this->connection = null;
        }
    }
}

// Para mantener compatibilidad con el código existente, creamos la conexión
$con = Database::getInstance()->getConnection();
?>