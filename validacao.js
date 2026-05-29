// =========================
// BLOQUEIO DE TELA (SENHA DA PORTARIA)
// =========================
const senhaPortaria = "120805"; // Mude para a senha que a sua equipe da portaria vai usar
const VERSAO_VALIDACAO = "v1";

if (localStorage.getItem("logado_portaria") !== VERSAO_VALIDACAO) {
    let acessoPermitido = false;
    
    while (!acessoPermitido) {
        const senhaDigitada = prompt("🛑 ÁREA RESTRITA DA PORTARIA\nDigite a senha de acesso para validar ingressos:");
        
        // Se a pessoa clicar em "Cancelar", a página fica em branco
        if (senhaDigitada === null) {
            document.body.innerHTML = "<h1 style='color:#d4af37; text-align:center; margin-top:50px;'>Acesso Negado.</h1>";
            break;
        }
        
        // Se a senha estiver correta
        if (senhaDigitada === senhaPortaria) {
            acessoPermitido = true;
            localStorage.setItem("logado_portaria", VERSAO_VALIDACAO);
            alert("✅ Acesso liberado!");
        } else {
            alert("❌ Senha incorreta.");
        }
    }
}
const codigoInput =
document.getElementById("codigo");

const btnValidar =
document.getElementById("btn-validar");

const resultado =
document.getElementById("resultado");

const pesquisaInput =
document.getElementById("pesquisa");

const btnPesquisar =
document.getElementById("btn-pesquisar");

const btnListar =
document.getElementById("btn-listar");

codigoInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        btnValidar.click();
        
        setTimeout(() => {
            codigoInput.value = '';
            codigoInput.focus();
        }, 500);
    }
});


// =========================
// VALIDAR QR/CÓDIGO
// =========================
btnValidar.addEventListener(
'click',
async () => {

    const codigo =
    codigoInput.value.trim();

    if(!codigo){

        alert(
        "Digite um código."
        );

        return;
    }

    try{

        const snapshot =
        await refReservas.once(
        "value"
        );

        const reservas =
        snapshot.val();
	
if(!reservas){

    resultado.innerHTML =
    `
    <div style="color:red">
    Nenhuma reserva encontrada.
    </div>
    `;

    return;
}

        let encontrado =
        false;

        for(
    const reservaId
    in reservas
){

    const reserva =
    reservas[reservaId];

    // VERIFICA SE TEM CONVIDADOS
    if(
        !reserva.convidados
    ){
        continue;
    }

    for(
        const key
        in reserva.convidados
    ){

        const convidado =
        reserva.convidados[key];

        if(
            convidado.codigo
            === codigo
        ){

            encontrado =
            true;

            // JÁ ENTROU
            if(
                convidado.usado
            ){

                resultado.innerHTML =
                `
                <div style="color:red">
                ❌ ESTE INGRESSO JÁ ENTROU
                <br><br>
                Mesa:
                ${reserva.mesa}
                <br>
                Responsável:
                ${reserva.responsavel}
                <br>
                Entrada:
                ${
                convidado.entradaEm
                || "-"
                }
                </div>
                `;

                return;
            }

            // LIBERA ENTRADA
            await refReservas
            .child(reservaId)
            .child("convidados")
            .child(key)
            .update({

                usado:true,

                entradaEm:
                new Date()
                .toLocaleString(
                'pt-BR'
                )
            });

            resultado.innerHTML =
            `
            <div style="color:green">
            ✅ ENTRADA LIBERADA
            <br><br>
            Mesa:
            ${reserva.mesa}
            <br>
            Responsável:
            ${reserva.responsavel}
            </div>
            `;

            return;
        }
    }
}

        if(!encontrado){

            resultado.innerHTML =
            `
            <div style="color:red">
            ❌ Código inválido
            </div>
            `;
        }

    }catch(error){

        alert(
        error.message
        );
    }
});


// =========================
// PESQUISAR RESERVA
// =========================
btnPesquisar.addEventListener(
'click',
async () => {

    const termo =
    pesquisaInput.value
    .trim()
    .toLowerCase();

    if(!termo){

        alert(
        "Digite mesa ou nome."
        );

        return;
    }

    try{

        const snapshot =
        await refReservas.once(
        "value"
        );

        const reservas =
        snapshot.val();

        let html = "";

        for(
            const reservaId
            in reservas
        ){

            const reserva =
            reservas[reservaId];

            const mesa =
            String(
            reserva.mesa
            ).toLowerCase();

            const nome =
            String(
            reserva.responsavel
            ).toLowerCase();

            if(
                mesa.includes(
                termo
                ) ||
                nome.includes(
                termo
                )
            ){

                html += `
                <div style="
                    border:1px solid #ccc;
                    padding:15px;
                    margin:15px 0;
                    border-radius:10px;
                ">

                <h3>
                Mesa:
                ${reserva.mesa}
                </h3>

                <p>
                <strong>
                Responsável:
                </strong>
                ${reserva.responsavel}
                </p>
                `;

              if(
    reserva.convidados
){

    for(
        const key
        in reserva.convidados
    ){

        const convidado =
        reserva.convidados[key];

        html += `
        <div style="
        border-top:1px solid #eee;
        padding:10px 0;
        ">

        <strong>
        Convidado
        ${key}
        </strong>

        <br>

        Código:
        ${convidado.codigo || "-"}

        <br>

        Status:
        ${
            convidado.usado
            ?
            "✅ ENTROU"
            :
            "⛔ NÃO ENTROU"
        }

        <br>

        ${
        convidado.entradaEm
        ?
        `Entrada:
        ${convidado.entradaEm}`
        :
        ""
        }

        <br><br>

        ${
        !convidado.usado
        ?
        `
        <button
        onclick="
        marcarEntrada(
        '${reservaId}',
        '${key}'
        )
        ">
        MARCAR ENTRADA
        </button>
        `
        :
        `
        <button disabled>
        JÁ ENTROU
        </button>
        `
        }

        </div>
        `;
    }

}else{

    html += `
    <p>
    Nenhum convidado encontrado.
    </p>
    `;
}

                html += `</div>`;
            }
        }

        if(!html){

            html =
            `
            <div>
            Nenhuma reserva encontrada.
            </div>
            `;
        }

        resultado.innerHTML =
        html;

    }catch(error){

        alert(
        error.message
        );
    }
});


// =========================
// MARCAR ENTRADA MANUAL
// =========================
async function marcarEntrada(
reservaId,
key
){

    try{

        await refReservas
        .child(reservaId)
        .child("convidados")
        .child(key)
        .update({

            usado:true,

            entradaEm:
            new Date()
            .toLocaleString(
            'pt-BR'
            )
        });

        alert(
        "Entrada confirmada."
        );

        if(
    pesquisaInput.value
    .trim()
){

    btnPesquisar.click();

}else{

    btnListar.click();
}

    }catch(error){

        alert(
        error.message
        );
    }
}

// =========================
// LISTAR TODAS RESERVAS
// =========================
btnListar.addEventListener(
'click',
async () => {

    try{

        resultado.innerHTML =
        "Carregando reservas...";

        const snapshot =
        await refReservas.once(
        "value"
        );

        const reservas =
        snapshot.val();

        console.log(
        "RESERVAS:",
        reservas
        );

        if(
            !reservas ||
            Object.keys(reservas)
            .length === 0
        ){

            resultado.innerHTML =
            `
            <div>
            Nenhuma reserva encontrada.
            </div>
            `;

            return;
        }

        let html = "";

        // ORDENA POR MESA
        const reservasArray =
        Object.entries(reservas)
        .sort((a,b)=>{

            const mesaA =
            String(
            a[1]?.mesa || ""
            );

            const mesaB =
            String(
            b[1]?.mesa || ""
            );

            return mesaA.localeCompare(
                mesaB,
                'pt-BR',
                {
                    numeric:true
                }
            );
        });

        for(
            const [
                reservaId,
                reserva
            ]
            of reservasArray
        ){

            let entrou = 0;
            let faltam = 0;

              html += `
                <div style="
                    border:1px solid #ccc;
                    padding:15px;
                    margin:15px 0;
                    border-radius:10px;
            ">

            <h3>
            🍷 Mesa:
            ${reserva.mesa || "-"}
            </h3>

            <p>
            <strong>
            Responsável:
            </strong>
            ${reserva.responsavel || "-"}
            </p>

            <p>
            <strong>
            Pessoas:
            </strong>
            ${reserva.qtd || 0}
            </p>
            `;

            // VERIFICA SE EXISTE CONVIDADOS
            if(
                reserva.convidados &&
                typeof reserva.convidados
                === "object"
            ){

                Object.entries(
                reserva.convidados
                ).forEach(
                ([key, convidado])=>{

                    if(
                        convidado.usado
                    ){
                        entrou++;
                    }else{
                        faltam++;
                    }

                    html += `
                    <div style="
                        border-top:1px solid #eee;
                        padding-top:10px;
                        margin-top:10px;
                    ">

                    <strong>
                    Convidado ${key}
                    </strong>

                    <br>

                    Código:
                    ${
                    convidado.codigo
                    || "-"
                    }

                    <br>

                    Status:
                    ${
                        convidado.usado
                        ?
                        "✅ ENTROU"
                        :
                        "⛔ NÃO ENTROU"
                    }

                    <br>

                    ${
                    convidado.entradaEm
                    ?
                    `Entrada:
                    ${convidado.entradaEm}`
                    :
                    ""
                    }

                    <br><br>

                    ${
                    !convidado.usado
                    ?
                    `
                    <button
                    onclick="
                    marcarEntrada(
                    '${reservaId}',
                    '${key}'
                    )
                    ">
                    MARCAR ENTRADA
                    </button>
                    `
                    :
                    `
                    <button disabled>
                    JÁ ENTROU
                    </button>
                    `
                    }

                    </div>
                    `;
                });
            }

            html += `
            <hr>

            <strong>
            ✅ Entraram:
            </strong>
            ${entrou}

            <br>

            <strong>
            ⛔ Faltam:
            </strong>
            ${faltam}

            </div>
            `;
        }

        resultado.innerHTML =
        html;

    }catch(error){

        console.error(error);

        resultado.innerHTML =
        `
        <div style="
        color:red;
        ">
        Erro:
        ${error.message}
        </div>
        `;
    }
});
