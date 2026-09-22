

const talleres = [
  { nombre: 'Introducción a Python', instructor: 'Ing. María López', cupo: 25, inscritos: 25 },
  { nombre: 'Fundamentos de Redes', instructor: 'Ing. Carlos Ramírez', cupo: 30, inscritos: 18 },
  { nombre: 'Diseño de Bases de Datos', instructor: 'Ing. Ana Torres', cupo: 20, inscritos: 20 },
  { nombre: 'Desarrollo Web con JS', instructor: 'Ing. María López', cupo: 25, inscritos: 10 },
];


function pintarTabla(datos = talleres) {
    const tbody = document.querySelector('#tabla-talleres tbody') || document.querySelector('#tabla-talleres');

    tbody.innerHTML = datos.map((t) => `
        <tr>
            <td>${t.nombre || t}</td>
            <td>${t.instructor ? t.instructor : ''}</td>
            <td>${t.cupo ? t.cupo : ''}</td>
            <td>${t.inscritos ? t.inscritos : ''}</td>
        </tr>
    `).join('');
}

const formArreglos = document.getElementById('form-arreglos');
const resultadoArreglos = document.getElementById('resultado-arreglo');
const selectOperacionArreglo = document.getElementById('operacion-arreglo');

formArreglos.addEventListener('submit', (evento) =>{
    evento.preventDefault();
    const operacion = selectOperacionArreglo.value;

    let resultado;

    switch(operacion){
        case 'forEach':
            talleres.forEach((t) => console.log(`- ${t.nombre} (${t.inscritos}/${t.cupo})`))
            resultado = talleres;
            break;
        case 'map':
            resultado = talleres.map((t) => t.nombre);
            break;
        case 'filter':
            resultado = talleres.filter((t) => t.inscritos >= t.cupo);
            break;
        case 'find':
            resultado = [talleres.find((t) => t.instructor === 'Ing. María López')];
            break;
    }

    pintarTabla(resultado);
});
pintarTabla();