// La página solo hace fetch a la API. El navegador manda la cookie solo (misma página, mismo servidor).
const $ = (id) => document.getElementById(id);

const CLAVES = {
  ana: 'ana12345',
  luis: 'luis12345',
  admin: 'admin12345'
};


//Aqui concentro el fetch y el manejo de errores para que ninguna otra funcion tenga que manejar si falló la red o si la respuesta no es un JSON y asi todas reciben lo mismo {status, datos}
async function llamar(metodo, url, cuerpo) {
    const opciones = {method: metodo}
    if(cuerpo !== undefined){
        opciones.headers = { "Content-Type": "application/json" };
        opciones.body = JSON.stringify(cuerpo)
    }

    let res;
    try{
        res = await fetch(url, opciones)
    }catch(error){
        return{status: 0, datos: {error: `No se pudo conectar: ${error.message}`}}
    }

    let datos = null;
    try{
        datos = await res.json();
    }catch{
        datos = null
    }

    return {status: res.status, datos}
}

//Sirve para mostrar las evidencias en la pantalla y se colorea el codigo con if's para distinguirlos
async function bitacora(metodo, url, codigo, datos) {
    const li = document.createElement("li")

    let clase = "error"
    if (codigo === 401) clase = 'e401'
    else if (codigo === 403) clase = 'e403'
    else if (codigo >= 200 && codigo < 300) clase = 'ok'

    const etiqueta = document.createElement("span")
    etiqueta.className = "codigo " + clase
    etiqueta.textContent = codigo

    const titulo = document.createElement("strong")
    titulo.textContent = " " + metodo + " " + url

    const detalle = document.createElement("pre")
    detalle.textContent = JSON.stringify(datos, null, 2)

    li.append(etiqueta, titulo, detalle)
    $("bitacora").prepend(li)
}

//esta funcion sirve para actualizar el estado de la sesion, y como se pidió muestra la cookie si no esta el efecto de httpOnly
async function actualizarEstado() {
    const r = await llamar('GET', '/api/sesion');

    if (r.status === 200) {
        $('estado').className = 'estado con-sesion';
        $('estado').textContent =
        r.datos.usuario.nombre + ' · ' +
        r.datos.usuario.rol + ' · ' +
        'sesión ' + r.datos.sesion + ' · ' +
        'vence en ' + r.datos.expiraEnSegundos + ' s';
    } else {
        $('estado').className = 'estado sin-sesion';
        $('estado').textContent = 'Sin sesión (el servidor responde 401)';
    }

    $('cookie-js').textContent = document.cookie || '(vacío)';
}

//Sirve para mostrar las sesiones que estan en el servidor o la base de datos, se reconstruye completa en cada refresh para no dejar las filas viejas
async function actualizarTabla() {
    const r = await llamar('GET', '/api/diagnostico/sesiones');

    const tbody = $('tabla-sesiones');
    tbody.replaceChildren();

    $('donde').textContent = r.datos.almacen === 'mysql'
        ? 'En MySQL, tabla sessions'
        : 'En la memoria del servidor';

    if (r.datos.sesiones.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.textContent = '(sin sesiones)';
        tr.append(td);
        tbody.append(tr);
        return;
    }

    for (const s of r.datos.sesiones) {
        const tr = document.createElement('tr');
        if (s.esLaTuya) tr.className = 'tuya';

        const valores = [
        s.sesion,
        s.usuario,
        s.visitas,
        s.expira ? new Date(s.expira).toLocaleTimeString('es-MX') : '—'
        ];

        for (const valor of valores) {
        const td = document.createElement('td');
        td.textContent = valor;
        tr.append(td);
        }
        tbody.append(tr);
    }
}

//refresca el estado y la tabla ya que siempre estan juntos asi cada que se actualiza no se tienen que hacer por separado con el riezgo de olvidarte
async function refrescar() {
    await actualizarEstado();
    await actualizarTabla();
}

//sirve para ver de forma visual la configuracion del servidor, inserta el json de la peticion en "config"
async function mostrarConfig() {
    const r = await llamar('GET', '/api/config');
    $('config').textContent = JSON.stringify(r.datos, null, 2);
}

$("usuario").addEventListener("change", () => {
    $("contrasena").value = CLAVES[$("usuario").value] || "";
});

$('form-login').addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const r = await llamar('POST', '/api/login', {
    usuario: $('usuario').value,
    contrasena: $('contrasena').value
  });

  bitacora('POST', '/api/login', r.status, r.datos);
  await refrescar();
});

document.querySelectorAll('[data-url]').forEach((boton) => {
  boton.addEventListener('click', async () => {
    const r = await llamar(boton.dataset.metodo, boton.dataset.url);

    bitacora(boton.dataset.metodo, boton.dataset.url, r.status, r.datos);
    await refrescar();
  });
});

$('btn-refrescar').addEventListener('click', refrescar);
$('btn-sesiones').addEventListener('click', actualizarTabla);

refrescar();
mostrarConfig();