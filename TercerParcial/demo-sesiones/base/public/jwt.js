const $ = (id) => document.getElementById(id);

const CLAVE = 'token';

const CLAVES = {
  ana: 'ana12345',
  luis: 'luis12345',
  admin: 'admin12345'
};

function leerToken() {
    try {
        return localStorage.getItem(CLAVE);
    } catch {
        return null;
    }
}

function guardarToken(token) {
    try {
        localStorage.setItem(CLAVE, token);
    } catch {}
    mostrarToken();
}

function borrarToken() {
    try {
        localStorage.removeItem(CLAVE);
    } catch {}
    mostrarToken();
}

function base64urlATexto(parte) {
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parte.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function textoABase64url(texto) {
    const bytes = new TextEncoder().encode(texto);
    let binario = '';
    bytes.forEach((b) => { binario += String.fromCharCode(b); });
    return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodificar(token) {
    const partes = (token || '').split('.');
    if (partes.length !== 3) return null;

    try {
        return {
            partes,
            cabecera: JSON.parse(base64urlATexto(partes[0])),
            carga: JSON.parse(base64urlATexto(partes[1]))
        };
    } catch {
        return null;
    }
}

async function llamar(metodo, url, cuerpo, sinToken = false) {
    const opciones = { method: metodo, headers: {} };

    const token = leerToken();
    if (token && !sinToken) opciones.headers.Authorization = 'Bearer ' + token;

    if (cuerpo !== undefined) {
        opciones.headers['Content-Type'] = 'application/json';
        opciones.body = JSON.stringify(cuerpo);
    }

    const conToken = Boolean(opciones.headers.Authorization);

    let res;
    try {
        res = await fetch(url, opciones);
    } catch (error) {
        return { status: 0, datos: { error: `No se pudo conectar: ${error.message}` }, conToken };
    }

    let datos = null;
    try {
        datos = await res.json();
    } catch {
        datos = null;
    }

    return { status: res.status, datos, conToken };
}

function bitacora(metodo, url, codigo, datos, conToken) {
    const li = document.createElement('li');

    let clase = 'error';
    if (codigo === 401) clase = 'e401';
    else if (codigo === 403) clase = 'e403';
    else if (codigo >= 200 && codigo < 300) clase = 'ok';

    const etiqueta = document.createElement('span');
    etiqueta.className = 'codigo ' + clase;
    etiqueta.textContent = codigo;

    const titulo = document.createElement('strong');
    titulo.textContent = ' ' + metodo + ' ' + url + (conToken ? ' · con Bearer' : ' · SIN token');

    const detalle = document.createElement('pre');
    detalle.textContent = JSON.stringify(datos, null, 2);

    li.append(etiqueta, titulo, detalle);
    $('bitacora').prepend(li);
}

function mostrarToken() {
    const token = leerToken();
    $('token').value = token || '';
    $('ls-js').textContent = token || '(vacío)';
    $('cookie-js').textContent = document.cookie || '(vacío)';

    const jwt = decodificar(token);
    const partes = $('partes');
    partes.replaceChildren();

    if (!jwt) {
        partes.textContent = token ? '(no es un JWT: deben ser 3 partes separadas por puntos)' : '—';
        $('cabecera').textContent = '—';
        $('carga').textContent = '—';
    } else {
        const clases = ['jwt-cabecera', 'jwt-carga', 'jwt-firma'];
        clases.forEach((clase, i) => {
            if (i > 0) partes.append('.');
            const span = document.createElement('span');
            span.className = clase;
            span.textContent = jwt.partes[i];
            partes.append(span);
        });

        $('cabecera').textContent = JSON.stringify(jwt.cabecera, null, 2);

        const carga = { ...jwt.carga };
        if (carga.iat) carga.iat = carga.iat + '  (' + new Date(carga.iat * 1000).toLocaleTimeString('es-MX') + ')';
        if (carga.exp) carga.exp = carga.exp + '  (' + new Date(carga.exp * 1000).toLocaleTimeString('es-MX') + ')';
        $('carga').textContent = JSON.stringify(carga, null, 2);
    }

    actualizarEstado();
}

function actualizarEstado() {
    const jwt = decodificar(leerToken());

    if (!jwt) {
        $('estado').className = 'estado sin-sesion';
        $('estado').textContent = 'Sin token: para el servidor eres anónimo (401)';
        return;
    }

    const faltan = jwt.carga.exp - Math.floor(Date.now() / 1000);

    if (faltan > 0) {
        $('estado').className = 'estado con-sesion';
        $('estado').textContent =
        'Token de ' + jwt.carga.usuario + ' · ' +
        'rol ' + jwt.carga.rol + ' · ' +
        'vence en ' + faltan + ' s (según el reloj del navegador)';
    } else {
        $('estado').className = 'estado sin-sesion';
        $('estado').textContent = 'Token de ' + jwt.carga.usuario + ' VENCIDO hace ' + (-faltan) + ' s';
    }
}

async function actualizarTabla() {
    const r = await llamar('GET', '/api/diagnostico/jwt', undefined, true);
    if (!r.datos || !r.datos.revocados) return;

    $('sesiones-mysql').textContent =
        'Filas en la tabla sessions: ' + r.datos.sesionesEnMySQL + '. Con JWT el servidor no crea ninguna.';

    const tbody = $('tabla-revocados');
    tbody.replaceChildren();

    if (r.datos.revocados.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 3;
        td.textContent = '(vacía)';
        tr.append(td);
        tbody.append(tr);
        return;
    }

    for (const t of r.datos.revocados) {
        const tr = document.createElement('tr');

        const valores = [
        t.jti,
        t.usuario,
        t.expira ? new Date(t.expira).toLocaleTimeString('es-MX') : '—'
        ];

        for (const valor of valores) {
        const td = document.createElement('td');
        td.textContent = valor;
        tr.append(td);
        }
        tbody.append(tr);
    }
}

async function refrescar() {
    mostrarToken();
    await actualizarTabla();
}

async function mostrarConfig() {
    const r = await llamar('GET', '/api/config', undefined, true);
    $('config').textContent = JSON.stringify(r.datos, null, 2);
}

$('usuario').addEventListener('change', () => {
    $('contrasena').value = CLAVES[$('usuario').value] || '';
});

$('form-login').addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const r = await llamar('POST', '/api/jwt/login', {
    usuario: $('usuario').value,
    contrasena: $('contrasena').value
  }, true);

  bitacora('POST', '/api/jwt/login', r.status, r.datos, r.conToken);
  if (r.status === 200 && r.datos && r.datos.token) guardarToken(r.datos.token);
  await refrescar();
});

document.querySelectorAll('[data-url]').forEach((boton) => {
  boton.addEventListener('click', async () => {
    const metodo = boton.dataset.metodo;
    const url = boton.dataset.url;
    const sinToken = boton.dataset.sinToken === 'si';

    const r = await llamar(metodo, url, undefined, sinToken);

    bitacora(metodo, url, r.status, r.datos, r.conToken);
    if (url === '/api/jwt/refresh' && r.status === 200 && r.datos && r.datos.token) guardarToken(r.datos.token);
    if (url === '/api/jwt/logout') borrarToken();
    await refrescar();
  });
});

$('btn-usar').addEventListener('click', () => {
    const token = $('token').value.trim();
    if (token) guardarToken(token);
    else borrarToken();
});

$('btn-alterar').addEventListener('click', () => {
    const jwt = decodificar(leerToken());
    if (!jwt) return;

    const carga = { ...jwt.carga, rol: 'admin' };
    guardarToken(jwt.partes[0] + '.' + textoABase64url(JSON.stringify(carga)) + '.' + jwt.partes[2]);
});

$('btn-borrar').addEventListener('click', borrarToken);
$('btn-servidor').addEventListener('click', actualizarTabla);

refrescar();
mostrarConfig();
setInterval(actualizarEstado, 1000);
