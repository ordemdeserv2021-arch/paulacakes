const SUPABASE_URL = "https://kryjeuetrduyelgrhmvp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OOcO_VELf8Hb7isW-DDTyA_O9KhJVmi";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let listaDeBolos = [];
let slidesCarrossel = [];
let slideAtivoIndex = 0;
let carrosselTimer = null;

// 🔄 CARREGAMENTO COMPLETO DA VITRINE WEB (PÚBLICO)
async function carregarVitrineWeb() {
    try {
        const loadingDiv = document.getElementById('loading');
        const vitrineDiv = document.getElementById('vitrine');

        // Busca todos os bolos ordenados do mais recente para o mais antigo
        const { data: bolos, error } = await supabaseClient
            .from('Bolo')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        vitrineDiv.innerHTML = "";
        listaDeBolos = bolos || [];

        if (listaDeBolos.length > 0) {
            // Filtra apenas os bolos que possuem imagem válida
            const bolosComFoto = listaDeBolos.filter(b => b.imagem_url);

            // 1. O Carrossel do Topo pega os 5 bolos mais recentes com foto
            slidesCarrossel = bolosComFoto;
            montarCarrosselDinamico();

            // Mostra TODOS os bolos na vitrine de baixo
            const bolosVitrine = listaDeBolos;

            if (bolosVitrine.length > 0) {
                bolosVitrine.forEach(bolo => {
                    const card = `
                        <div class="card-bolo" onclick="abrirModalDetalhes(${bolo.id})">
                           ${bolo.imagem_url ? `<img src="${bolo.imagem_url}" alt="${bolo.nome}" class="imagem-card-bolo">` : ''}
                            <div class="topo-card">
                                <div class="info-bolo">
                                    <h2>${bolo.nome}</h2>
                                    <p>Sabor: ${bolo.sabor}</p>
                                </div>
                            </div>
                            <a href="https://wa.me/5521964631442?text=Olá! Gostaria de saber o valor e encomendar o bolo: ${encodeURIComponent(bolo.nome)}" 
                               target="_blank" 
                               class="btn-whatsapp"
                               onclick="event.stopPropagation();">
                                Encomendar no WhatsApp
                            </a>
                        </div>
                    `;
                    vitrineDiv.innerHTML += card;
                });
            } else {
                vitrineDiv.innerHTML = "<p style='text-align:center; padding: 20px; grid-column: 1/-1;'>Confira nossos destaques mais recentes no carrossel do topo!</p>";
            }
        } else {
            vitrineDiv.innerHTML = "<p style='text-align:center; padding: 20px;'>Nenhum bolo cadastrado no momento.</p>";
        }

        if (loadingDiv) loadingDiv.style.display = 'none';
        if (vitrineDiv) vitrineDiv.style.display = 'grid';

    } catch (error) {
        console.error("Erro ao carregar dados:", error.message);
        if (document.getElementById('loading')) {
            document.getElementById('loading').innerText = "Erro ao conectar com a nuvem: " + error.message;
        }
    }
}

// 🎪 MONTAGEM DA LÓGICA DO CARROSSEL
function montarCarrosselDinamico() {
    const carrosselArea = document.getElementById('carrossel-area');
    const carrosselJanela = document.getElementById('carrossel-janela');

    if (!carrosselArea || !carrosselJanela) return;

    if (slidesCarrossel.length === 0) {
        carrosselArea.style.display = 'none';
        return;
    }

    carrosselJanela.innerHTML = "";
    slideAtivoIndex = 0;

    slidesCarrossel.forEach((bolo, idx) => {
        const slide = document.createElement('div');
        slide.className = `slide-carrossel ${idx === 0 ? 'ativo' : ''}`;
        slide.onclick = () => abrirModalDetalhes(bolo.id);

        slide.innerHTML = `
            <img src="${bolo.imagem_url}" alt="${bolo.nome}">
            <div class="legenda-carrossel">${bolo.nome}</div>
        `;
        carrosselJanela.appendChild(slide);
    });

    carrosselArea.style.display = 'block';

    if (slidesCarrossel.length > 1) {
        if (carrosselTimer) clearInterval(carrosselTimer);
        carrosselTimer = setInterval(proximoSlide, 4000);
    }
}

function proximoSlide() {
    const slides = document.querySelectorAll('.slide-carrossel');
    if (slides.length === 0) return;

    slides[slideAtivoIndex].classList.remove('ativo');
    slideAtivoIndex = (slideAtivoIndex + 1) % slides.length;
    slides[slideAtivoIndex].classList.add('ativo');
}

// 🎮 LÓGICA DOS DETALHES EM POPUP (ESTILO MERCADO LIVRE)
function abrirModalDetalhes(idDoBolo) {
    const bolo = listaDeBolos.find(b => b.id === idDoBolo);
    if (!bolo) return;

    if (document.getElementById('modal-nome-bolo')) document.getElementById('modal-nome-bolo').innerText = bolo.nome;
    if (document.getElementById('modal-sabor-bolo')) document.getElementById('modal-sabor-bolo').innerText = `Sabor: ${bolo.sabor}`;
    if (document.getElementById('modal-preco-bolo')) {
        document.getElementById('modal-preco-bolo').innerText = `R$ ${Number(bolo.preco).toFixed(2)}`;
    }

    const btnWhats = document.getElementById('modal-btn-whatsapp');
    if (btnWhats) {
        btnWhats.href = `https://wa.me/5521964631442?text=Olá! Gostaria de saber o valor e encomendar o bolo: ${encodeURIComponent(bolo.nome)}`;
    }

    const fotoGrande = document.getElementById('foto-grande');
    if (fotoGrande) fotoGrande.src = bolo.imagem_url || '';

    const wrapperMiniaturas = document.getElementById('wrapper-miniaturas');
    if (wrapperMiniaturas) {
        wrapperMiniaturas.innerHTML = "";

        const fotosValidas = [bolo.imagem_url, bolo.imagem_url_2, bolo.imagem_url_3].filter(url => url);

        if (fotosValidas.length > 0) {
            fotosValidas.forEach(url => {
                const miniatura = document.createElement('img');
                miniatura.src = url;
                miniatura.alt = "Miniatura do bolo";
                miniatura.style.width = "50px";
                miniatura.style.height = "50px";
                miniatura.style.objectFit = "cover";
                miniatura.style.cursor = "pointer";
                miniatura.style.border = "2px solid #ddd";
                miniatura.style.borderRadius = "4px";
                miniatura.style.display = "block";
                miniatura.style.marginBottom = "5px";

                miniatura.onclick = function () {
                    if (fotoGrande) fotoGrande.src = url;
                };

                wrapperMiniaturas.appendChild(miniatura);
            });
            wrapperMiniaturas.style.display = 'block';
        } else {
            wrapperMiniaturas.style.display = 'none';
        }
    }

    const modalProduto = document.getElementById('modal-produto');
    if (modalProduto) {
        modalProduto.style.display = 'flex';
    }
}

// ❌ FUNÇÃO PARA FECHAR O MODAL
function fecharModal() {
    const modalProduto = document.getElementById('modal-produto');
    if (modalProduto) {
        modalProduto.style.display = 'none';
    }
}

// 🕶️ FECHAR SE O CLIENTE CLICAR FORA DA CAIXA BRANCA
function fecharModalExterno(event) {
    if (event.target.id === 'modal-produto') {
        fecharModal();
    }
}

// 🚀 DISPARAR CARREGAMENTO AO ABRIR A PÁGINA
window.onload = carregarVitrineWeb;