let despesas = [];
let chaveDespesas = null;
let chaveTema = null;

let editarId = null;
let temporizadorMensagem = null;
let meuGrafico = null;

// Normalizar o nome do user
function normalizarNome(nome) {
    return nome.trim().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

const categorias = [
    'Alimentação',
    'Casa',
    'Transportes',
    'Lazer',
    'Outros'
];

const cores = [
    '#B9A0DE',
    '#F2B58D',
    '#D98BAA',
    '#A8D58B',
    '#83A9D9'
];
git add .

const secLogin = document.getElementById('login');
const secApp = document.getElementById('app');
const formLogin = document.getElementById('form-login');
const inputNome = document.getElementById('nome');
const titOla = document.getElementById('ola');
const btnTema = document.getElementById('btn-tema');
const btnSair = document.getElementById('btn-sair');
const pDataHora = document.getElementById('data-hora');
const pTempo = document.getElementById('tempo');

const formDespesa = document.getElementById('form-despesa');
const inputDescricao = document.getElementById('descricao');
const inputValor = document.getElementById('valor');
const selectCategoria = document.getElementById('categoria');
const btnGuardar = document.getElementById('btn-guardar');
const pMensagem = document.getElementById('mensagem');
const selectFiltro = document.getElementById('filtro');
const spanTotal = document.getElementById('total');
const lista = document.getElementById('lista');

const grafico = document.getElementById('graficoDespesas');
const legendaGrafico = document.getElementById('legendaGrafico');
const totalGrafico = document.getElementById('totalGrafico');

const btnExportar = document.getElementById('btn-exportar');


/***** Soma dos valores *****/

function somar(listaDespesas) {
    return listaDespesas.reduce(function (soma, d) {
        return soma + d.valor;
    }, 0);
}


/***** Feedback ao utilizador *****/

function mostrarMensagem(texto, tipo) {
    pMensagem.textContent = texto;
    pMensagem.className = 'mensagem ' + tipo;

    clearTimeout(temporizadorMensagem);

    temporizadorMensagem = setTimeout(function () {
        pMensagem.textContent = '';
        pMensagem.className = 'mensagem';
    }, 3000);
}


/***** Login - localStorage *****/

formLogin.addEventListener('submit', function (event) {
    event.preventDefault();

    const nome = inputNome.value.trim();

    if (nome === '') {
        mostrarMensagem('Introduz o teu nome.', 'erro');
        return;
    }

    localStorage.setItem('utilizador', nome);

    formLogin.reset();
    mostrarApp();
});


/***** Terminar sessão *****/

btnSair.addEventListener('click', function () {
    localStorage.removeItem('utilizador');

    despesas = [];
    chaveDespesas = null;
    chaveTema = null;
    editarId = null;

    formDespesa.reset();
    btnGuardar.textContent = 'Adicionar';

    lista.innerHTML = '';
    spanTotal.textContent = '0.00';
    legendaGrafico.innerHTML = '';
    totalGrafico.textContent = '0.00 €';

    if (meuGrafico !== null) {
        meuGrafico.destroy();
        meuGrafico = null;
    }

    secApp.classList.add('escondido');
    secLogin.classList.remove('escondido');
});


/***** Mostra app *****/

function mostrarApp() {
    const nome = localStorage.getItem('utilizador');

    if (nome === null) {
        secLogin.classList.remove('escondido');
        secApp.classList.add('escondido');
        return;
    }

    chaveDespesas = 'despesas_' + normalizarNome(nome);

    chaveTema = 'tema_' + normalizarNome(nome);

    aplicarTema();

    try {
        despesas = JSON.parse(localStorage.getItem(chaveDespesas)) || [];
    } catch (erro) {
        console.log('Dados inválidos no localStorage:', erro);
        despesas = [];
    }

    titOla.textContent = 'Olá ' + nome + '!';

    secLogin.classList.add('escondido');
    secApp.classList.remove('escondido');

    mostrarDespesas();
}


/***** Tema - localStorage *****/

function aplicarTema() {
    const noturno = chaveTema !== null &&
        localStorage.getItem(chaveTema) === 'noturno';

    document.body.classList.toggle('noturno', noturno);

    btnTema.textContent = noturno
        ? '☀️ Modo diurno'
        : '🌙 Modo noturno';
}

btnTema.addEventListener('click', function () {
    const noturno = document.body.classList.contains('noturno');

    if (chaveTema !== null) {
        localStorage.setItem(chaveTema, noturno ? 'claro' : 'noturno');
    }

    aplicarTema();
});


/***** Data e hora *****/

function atualizarRelogio() {
    pDataHora.textContent = new Date().toLocaleString('pt-PT');
}

setInterval(atualizarRelogio, 1000);

atualizarRelogio();


/***** API do tempo *****/

function carregarTempo() {
    const url = 'https://api.ipma.pt/open-data/forecast/meteorology/cities/daily/1110600.json';

    fetch(url)
        .then(function (resposta) {
            if (!resposta.ok) {
                throw new Error('Erro do servidor: ' + resposta.status);
            }

            return resposta.json();
        })
        .then(function (dados) {
            const previsao = dados.data[0];

            pTempo.textContent = 'Lisboa: ' +
                previsao.tMin + ' °C a ' +
                previsao.tMax + ' °C | Probabilidade de chuva: ' +
                previsao.precipitaProb + '%';
        })
        .catch(function (erro) {
            pTempo.textContent = 'Não foi possível carregar a previsão do tempo.';

            console.log('Erro na API:', erro);
        });
}

carregarTempo();


/***** Despesas *****/

function guardarDespesas() {
    if (chaveDespesas !== null) {
        localStorage.setItem(chaveDespesas, JSON.stringify(despesas));
    }
}

formDespesa.addEventListener('submit', function (event) {
    event.preventDefault();

    const descricao = inputDescricao.value.trim();
    const valor = Number(inputValor.value);
    const categoria = selectCategoria.value;

    // Validação
    if (descricao.length < 3) {
        mostrarMensagem('A descrição precisa de pelo menos 3 caracteres.', 'erro');
        return;
    }

    if (isNaN(valor) || valor <= 0) {
        mostrarMensagem('O valor tem de ser maior que 0.', 'erro');
        return;
    }

    if (editarId === null) {

        despesas.push({
            id: Date.now(),
            descricao: descricao,
            valor: valor,
            categoria: categoria
        });

        mostrarMensagem('Despesa adicionada!', 'sucesso');

    } else {

        const despesa = despesas.find(function (d) {
            return d.id === editarId;
        });

        despesa.descricao = descricao;
        despesa.valor = valor;
        despesa.categoria = categoria;

        editarId = null;
        btnGuardar.textContent = 'Adicionar';

        mostrarMensagem('Despesa atualizada!', 'sucesso');
    }

    guardarDespesas();

    formDespesa.reset();

    mostrarDespesas();
});


/***** Apagar despesa *****/

function apagar(id) {
    despesas = despesas.filter(function (d) {
        return d.id !== id;
    });

    if (editarId === id) {
        editarId = null;
        btnGuardar.textContent = 'Adicionar';
        formDespesa.reset();
    }

    guardarDespesas();
    mostrarDespesas();

    mostrarMensagem('Despesa apagada.', 'sucesso');
}


/***** Editar despesa *****/

function editar(id) {
    const despesa = despesas.find(function (d) {
        return d.id === id;
    });

    inputDescricao.value = despesa.descricao;
    inputValor.value = despesa.valor;
    selectCategoria.value = despesa.categoria;

    editarId = id;

    btnGuardar.textContent = 'Guardar alterações';

    inputDescricao.focus();
}


/***** Mostrar despesas *****/

function mostrarDespesas() {
    const categoriaFiltro = selectFiltro.value;

    const visiveis = despesas.filter(function (d) {
        return categoriaFiltro === 'todas' || d.categoria === categoriaFiltro;
    });

    lista.innerHTML = '';

    visiveis.forEach(function (d) {
        const li = document.createElement('li');

        const texto = document.createElement('span');

        texto.textContent = d.descricao + ' (' +
            d.categoria + ') - ' +
            d.valor.toFixed(2) + ' €';

        const botoes = document.createElement('div');

        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.addEventListener('click', function () {
            editar(d.id);
        });

        const btnApagar = document.createElement('button');
        btnApagar.textContent = 'Apagar';
        btnApagar.addEventListener('click', function () {
            apagar(d.id);
        });

        botoes.appendChild(btnEditar);
        botoes.appendChild(btnApagar);

        li.appendChild(texto);
        li.appendChild(botoes);

        lista.appendChild(li);
    });

    spanTotal.textContent = somar(visiveis).toFixed(2);

    mostrarGrafico();
}


selectFiltro.addEventListener('change', mostrarDespesas);


/***** Gráfico *****/

function mostrarGrafico() {

    const valores = categorias.map(function (categoria) {
        return somar(despesas.filter(function (d) {
            return d.categoria === categoria;
        }));
    });


    // Legenda
    legendaGrafico.innerHTML = '';

    categorias.forEach(function (categoria, i) {

        const linha = document.createElement('div');
        linha.classList.add('item-legenda');

        const cor = document.createElement('span');
        cor.classList.add('cor-legenda');
        cor.style.backgroundColor = cores[i];

        const nome = document.createElement('span');
        nome.textContent = categoria;

        const valor = document.createElement('span');
        valor.textContent = valores[i].toFixed(2) + ' €';

        linha.appendChild(cor);
        linha.appendChild(nome);
        linha.appendChild(valor);

        legendaGrafico.appendChild(linha);
    });


    // Total - gráfico
    totalGrafico.textContent = somar(despesas).toFixed(2) + ' €';


    // Destrói gráfico anterior antes de criar outro
    if (meuGrafico !== null) {
        meuGrafico.destroy();
    }


    // Cria novo gráfico
    meuGrafico = new Chart(grafico, {
        type: 'doughnut',

        data: {
            labels: categorias,

            datasets: [{
                data: valores,
                backgroundColor: cores,
                borderColor: '#fffcfc',
                borderWidth: 2,
                hoverOffset: 8
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    padding: 12,
                    titleMarginBottom: 8,
                    bodySpacing: 6,
                    boxPadding: 6,
                    caretPadding: 10,
                    cornerRadius: 8
                }
            }
        }
    });
}


/***** Exportar despesas para CSV *****/

function exportarCSV() {

    if (despesas.length === 0) {
        mostrarMensagem('Não existem despesas para exportar.', 'erro');
        return;
    }

    const linhas = despesas.map(function (d) {
        return '"' + d.descricao + '";' + d.valor.toFixed(2) + ';' + d.categoria;
    });

    const csv = 'Descrição;Valor;Categoria\n' + linhas.join('\n');

    const ficheiro = new Blob(
        ['\uFEFF' + csv],
        { type: 'text/csv;charset=utf-8;' }
    );

    const link = document.createElement('a');

    link.href = URL.createObjectURL(ficheiro);
    link.download = 'minhas-despesas.csv';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(link.href);
}

btnExportar.addEventListener('click', exportarCSV);


/***** Arranque *****/

mostrarApp();