// Proteção Simples (Não segura)
const senhaCorreta = "4321"; 
let acessoPermitido = false;

while (!acessoPermitido) {
    const senhaDigitada = prompt("Por favor, digite a senha para acessar o mapa:");
    
    if (senhaDigitada === senhaCorreta) {
        acessoPermitido = true;
        alert("Acesso concedido!");
    } else {
        alert("Senha incorreta. Tente novamente.");
    }
}
// O restante do seu script.js só rodará se a senha estiver correta.

document.addEventListener('DOMContentLoaded', () => {
    // 1. Seletores
    const mesas = document.querySelectorAll('.mesa');
    const modalOverlay = document.getElementById('modal-mesa');
    const modalDisplayId = document.getElementById('mesa-id-display');
    const formOcupacao = document.getElementById('form-ocupacao');
    const btnFechar = document.querySelector('.btn-fechar');
    const btnLiberar = document.querySelector('.btn-liberar');
    const btnExportar = document.getElementById('btn-exportar');

    let mesaSelecionada = null;

    // 2. ☁️ CARREGAR DADOS DO FIREBASE EM TEMPO REAL
    const carregarStatusMesas = () => {
        refMesas.on('value', (snapshot) => {
            const statusAtualizado = snapshot.val();
            
            mesas.forEach(mesa => {
                const mesaId = mesa.id;
                const statusMesa = statusAtualizado && statusAtualizado[mesaId] ? statusAtualizado[mesaId] : null;

                if (statusMesa && statusMesa.status === 'ocupada') {
                    mesa.classList.add('ocupada');
                    // Salva os dados no elemento DOM para uso temporário
                    mesa.dataset.dados = JSON.stringify({ nome: statusMesa.nome, obs: statusMesa.obs }); 
                } else {
                    mesa.classList.remove('ocupada');
                    delete mesa.dataset.dados;
                }
            });
        });
    };

    // 3. 🖱️ Adicionar ouvinte de clique para cada mesa
    mesas.forEach(mesa => {
        mesa.addEventListener('click', () => {
            mesaSelecionada = mesa;
            const mesaNome = mesa.dataset.nome;
            const isOcupada = mesa.classList.contains('ocupada');
            
            modalDisplayId.textContent = mesaNome;
            btnLiberar.dataset.mesaId = mesa.id;

            // Preenche o formulário
            if (isOcupada && mesa.dataset.dados) {
                const dados = JSON.parse(mesa.dataset.dados);
                document.getElementById('nome-ocupante').value = dados.nome || '';
                document.getElementById('observacoes').value = dados.obs || '';
                btnLiberar.style.display = 'block';
                document.querySelector('.btn-ocupar').textContent = 'Atualizar Ocupação';
            } else {
                formOcupacao.reset();
                btnLiberar.style.display = 'none';
                document.querySelector('.btn-ocupar').textContent = 'Confirmar Ocupação';
            }
            
            modalOverlay.style.display = 'flex';
        });
    });

    // 4. ☁️ Lógica de Ocupar/Atualizar
    formOcupacao.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (mesaSelecionada) {
            const nome = document.getElementById('nome-ocupante').value;
            const obs = document.getElementById('observacoes').value;
            
            const dadosParaFirebase = {
                status: 'ocupada',
                nome: nome,
                obs: obs,
                timestamp: new Date().toISOString()
            };

            // SALVA NO FIREBASE
            refMesas.child(mesaSelecionada.id).set(dadosParaFirebase)
                .then(() => {
                    modalOverlay.style.display = 'none';
                    alert(`Mesa ${mesaSelecionada.dataset.nome} ocupada/atualizada e sincronizada!`);
                })
                .catch(error => {
                    alert("Erro ao salvar no Firebase: " + error.message);
                });
        }
    });

    // 5. ☁️ Lógica de Liberar - COM CONFIRMAÇÃO
    btnLiberar.addEventListener('click', () => {
        if (mesaSelecionada) {
            
            // Adiciona a confirmação
            const confirmar = confirm(`Tem certeza que deseja LIBERAR a mesa ${mesaSelecionada.dataset.nome}?`);
            
            if (confirmar) {
                // REMOVE O DADO DO FIREBASE
                refMesas.child(mesaSelecionada.id).remove()
                    .then(() => {
                        modalOverlay.style.display = 'none';
                        alert(`Mesa ${mesaSelecionada.dataset.nome} liberada e sincronizada!`);
                    })
                    .catch(error => {
                        alert("Erro ao liberar no Firebase: " + error.message);
                    });
            }
        }
    });

    // 6. Fechar Modal
    btnFechar.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
    });
    
    // 7. 📊 Lógica de Exportação para CSV (AGORA COM CORREÇÃO DE QUEBRA DE LINHA)
    btnExportar.addEventListener('click', () => {
        // Pega o estado atual do Firebase
        refMesas.once('value').then((snapshot) => {
            const statusFirebase = snapshot.val() || {};
            
            // Define o cabeçalho e o separador (ponto e vírgula)
            let dadosCSV = "Mesa;Status;Nome dos Ocupantes;Observacoes\n";
            let mesasEncontradas = false;

            mesas.forEach(mesa => {
                const mesaId = mesa.id;
                const mesaNome = mesa.dataset.nome;
                const statusDados = statusFirebase[mesaId];

                let statusDisplay = "LIVRE";
                let nomeOcupante = "";
                let obs = "";

                if (statusDados && statusDados.status === 'ocupada') {
                    statusDisplay = "OCUPADA";
                    
                    // 1. Limpa o Nome (Substitui ';' por ',' para o CSV)
                    nomeOcupante = statusDados.nome ? statusDados.nome.replace(/;/g, ',') : "";
                    
                    // 💡 CORREÇÃO DE QUEBRA DE LINHA:
                    // Remove todas as quebras de linha (\r\n, \n, \r) e substitui por espaço.
                    // Em seguida, substitui ';' por ',' dentro do texto.
                    obs = statusDados.obs ? statusDados.obs.replace(/(\r\n|\n|\r)/gm, ' ').replace(/;/g, ',') : "";
                }
                
                // Adiciona a linha ao CSV
                dadosCSV += `${mesaNome};${statusDisplay};${nomeOcupante};${obs}\n`;
                mesasEncontradas = true;
            });

            if (!mesasEncontradas) {
                alert("Nenhuma mesa foi encontrada para exportação. Verifique se as mesas foram adicionadas ao HTML.");
                return;
            }

            // Cria e inicia o download do arquivo
            const nomeArquivo = `Status_Mesas_${new Date().toISOString().slice(0, 10)}.csv`;
            const blob = new Blob(['\ufeff', dadosCSV], { type: 'text/csv;charset=utf-8;' }); // \ufeff é o BOM para forçar o Excel a usar UTF-8
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', nomeArquivo);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    });

    // Inicia o carregamento
    carregarStatusMesas();

});
