const SUPABASE_URL = "https://kryjeuetrduyelgrhmvp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OOcO_VELf8Hb7isW-DDTyA_O9KhJVmi";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let listaDeBolos = [];
let slidesCarrossel = [];
let slideAtivoIndex = 0;
let carrosselTimer = null;

// 🔄 CARREGAMENTO COMPLETO DA VITRINE (ADMINISTRATIVO CORRIGIDO)
// 🔄 CARREGAMENTO COMPLETO DA VITRINE WEB (PÚBLICO - CORRIGIDO)
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
            slidesCarrossel = bolosComFoto.slice(0, 5);
            montarCarrosselDinamico();

            // 🔥 CORREÇÃO: Mostra TODOS os bolos na vitrine de baixo sem ocultar os novos, 
            // mas mantendo o layout público original
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

// 🎮 LÓGICA DOS DETALHES EM POPUP
function abrirModalDetalhes(idDoBolo) {
    const bolo = listaDeBolos.find(b => b.id === idDoBolo);
    if (!bolo) return;

    if (document.getElementById('modal-nome-bolo')) document.getElementById('modal-nome-bolo').innerText = bolo.nome;
    if (document.getElementById('modal-sabor-bolo')) document.getElementById('modal-sabor-bolo').innerText = `Sabor: ${bolo.sabor}`;

    const fotoGrande = document.getElementById('foto-grande');
    if (fotoGrande) fotoGrande.src = bolo.imagem_url || '';

    document.getElementById('modal-produto').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modal-produto').style.display = 'none';
}

window.onload = carregarVitrineWeb;