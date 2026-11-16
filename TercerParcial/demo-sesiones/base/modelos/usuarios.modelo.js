// Consultas a la tabla usuarios. Siempre con ? (consulta parametrizada), nunca pegando texto en el SQL.
const bcrypt = require('bcryptjs');

function crearModeloUsuarios(pool) {
  // Regresa el usuario (sin el hash) si la contraseña es correcta, o null si no.
  async function verificar(usuario, contrasena) {
  const [filas] = await pool.query(
    'SELECT usuario, nombre, rol, contrasena_hash FROM usuarios WHERE usuario = ?',
    [usuario]
  );
  if (filas.length === 0) return null;

  const u = filas[0];
  const coincide = await bcrypt.compare(contrasena, u.contrasena_hash);
  if (!coincide) return null;

  return { usuario: u.usuario, nombre: u.nombre, rol: u.rol };
}

  return { verificar };
}

module.exports = { crearModeloUsuarios };
