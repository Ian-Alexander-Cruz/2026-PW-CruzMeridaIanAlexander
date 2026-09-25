
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
            let seleccion = prompt("Elige una opción:\n1. Ing. María López\n2. Ing. Carlos Ramírez\n3. Ing. Ana Torres");
            let maestro
            switch(seleccion){
                case '1':
                    maestro = 'Ing. María López'
                    break
                case '2':
                    maestro = 'Ing. Carlos Ramírez'
                    break
                case '3':
                    maestro = 'Ing. Ana Torres'
                    break      
                default:
                    alert('Se ha seleccionado automaticamente a Ing. María López')
                    maestro = 'Ing. María López'
            }
            resultado = [talleres.find((t) => t.instructor === maestro)];
            break;
    }

    pintarTabla(resultado);
});
pintarTabla();

//segunda parte

const formObjeto = document.getElementById('form-objeto');
const resultadoObjeto = document.getElementById('resultado-objeto');

formObjeto.addEventListener('submit', (evento) => {
    evento.preventDefault();

    //construimos el objeto de talleres
    const taller = {
        nombre : document.getElementById('obj-nombre').value,
        instructor : document.getElementById('obj-instructor').value,
        cupo : Number(document.getElementById('obj-cupo').value),
        inscritos : Number(document.getElementById('obj-inscritos').value)
    };

    const operacion = document.getElementById('operacion-objeto').value;

    let resultado;

    switch(operacion){
        case 'keys':
            resultado = JSON.stringify(Object.keys(taller));
            break;
        case 'values':
            resultado = JSON.stringify(Object.values(taller))
            break;
        case 'entries':
            resultado = Object.entries(taller).map(([campo,valor]) => `${campo}: ${valor}`).join('\n');
            break;
        case 'stringify':
            resultado = JSON.stringify(taller, null, 2);
            break;
        case 'roundtrip':
            const textoJson = JSON.stringify(taller, null, 2);
            const objetoDeVuelta = JSON.parse(textoJson);

            resultado = [
                '',
                textoJson,
                '',
                `tipo: ${typeof objetoDeVuelta}`,
                objetoDeVuelta.nombre
            ].join('\n');
            break;
    }

    resultadoObjeto.textContent = resultado;
})