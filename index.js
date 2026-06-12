const SUPABASE_URL = "https://kryjeuetrduyelgrhmvp.supabase.co";
        const SUPABASE_ANON_KEY = "sb_publishable_OOcO_VELf8Hb7isW-DDTyA_O9KhJVmi";

        const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        let listaDeBolos = [];
        let slideAtivoIndex = 0;
        let carrosselTimer = null;

        // 🔄 CARREGAMENTO COMPLETO DA VITRINE WEB
        async function carregarVitrineWeb() {
            try {
                const loadingDiv = document.getElementById('loading');
                const vitrineDiv = document.getElementById('vitrine');

                const { data: bolos, error } = await supabaseClient
                    .from('Bolo')
                    .select('*')
                    .order('id', { ascending: false });

                if (error) throw error;

                vitrineDiv.innerHTML = "";
                listaDeBolos = bolos || [];

                if (listaDeBolos.length > 0) {
                    // 1. Monta o Carrossel do Topo de forma automatizada com os bolos que têm fotos válidas
                    montarCarrosselDinamico();

                    // 2. Renderiza os Cards na Lista debaixo
                    listaDeBolos.forEach(bolo => {
                        const card = `
                            <div class="card-bolo" onclick="abrirModalDetalhes(${bolo.id})">
                               ${bolo.imagem_url ? `<img src="${bolo.imagem_url}" alt="${bolo.nome}" style="width:100%; max-height:260px; object-fit:contain; background-color:#fafafa; border-radius:6px; margin-bottom:0.5rem;">` : ''}
                                <div class="topo-card">
                                    <div class="info-bolo">
                                        <h2>${bolo.nome}</h2>
                                        <p>Sabor: ${bolo.sabor}</p>
                                    </div>
                                    <div class="preco-bolo">
                                        R$ ${bolo.preco ? bolo.preco.toFixed(2) : "0.00"}
                                    </div>
                                </div>
                                <a href="https://wa.me/5521964631442?text=Olá! Gostaria de encomendar o ${encodeURIComponent(bolo.nome)}" 
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
                    vitrineDiv.innerHTML = "<p style='text-align:center; padding: 20px;'>Nenhum bolo cadastrado no momento.</p>";
                }

                loadingDiv.style.display = 'none';
                vitrineDiv.style.display = 'grid';

            } catch (error) {
                console.error("Erro ao carregar dados:", error.message);
                document.getElementById('loading').innerText = "Erro ao conectar com a nuvem: " + error.message;
            }
        }

        // 🎪 MONTAGEM DA LÓGICA DO CARROSSEL DE IMAGENS
        function montarCarrosselDinamico() {
            const carrosselArea = document.getElementById('carrossel-area');
            const carrosselJanela = document.getElementById('carrossel-janela');

            // Filtra apenas os bolos que possuem imagem preenchida para o carrossel
            const bolosComFoto = listaDeBolos.filter(b => b.imagem_url);

            if (bolosComFoto.length === 0) return;

            carrosselJanela.innerHTML = "";

            // Exibe apenas até 5 itens principais no carrossel para ficar fluido
            const itensCarrossel = bolosComFoto.slice(0, 5);

            itensCarrossel.forEach((bolo, idx) => {
                const slide = document.createElement('div');
                slide.className = `slide-carrossel ${idx === 0 ? 'ativo' : ''}`;
                slide.onclick = () => abrirModalDetalhes(bolo.id);

                slide.innerHTML = `
                    <img src="${bolo.imagem_url}" alt="${bolo.nome}">
                    <div class="legenda-carrossel">${bolo.nome} - R$ ${bolo.preco.toFixed(2)}</div>
                `;
                carrosselJanela.appendChild(slide);
            });

            carrosselArea.style.display = 'block';

            // Se houver mais de 1 slide, ativa o temporizador automático (roda a cada 4 segundos)
            if (itensCarrossel.length > 1) {
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

            document.getElementById('modal-nome-bolo').innerText = bolo.nome;
            document.getElementById('modal-sabor-bolo').innerText = `Sabor: ${bolo.sabor}`;
            document.getElementById('modal-preco-bolo').innerText = `R$ ${bolo.preco ? bolo.preco.toFixed(2) : "0.00"}`;
            document.getElementById('modal-btn-whatsapp').href = `https://wa.me/5521964631442?text=Olá! Gostaria de encomendar o ${encodeURIComponent(bolo.nome)}`;

            const fotoGrande = document.getElementById('foto-grande');
            fotoGrande.src = bolo.imagem_url || '';

            const containerMiniaturas = document.getElementById('wrapper-miniaturas');
            containerMiniaturas.innerHTML = "";

            const fotosDisponiveis = [bolo.imagem_url, bolo.imagem_url_2, bolo.imagem_url_3].filter(url => url !== null && url !== '');

            // Só monta a barra lateral de miniaturas se o bolo tiver mais de uma imagem cadastrada
            if (fotosDisponiveis.length > 1) {
                fotosDisponiveis.forEach((url, index) => {
                    const imgMini = document.createElement('img');
                    imgMini.src = url;
                    imgMini.className = `miniatura ${index === 0 ? 'ativa' : ''}`;
                    imgMini.alt = `Miniatura ${index + 1}`;
                    imgMini.onclick = function () {
                        mudarFotoDestaque(url, imgMini);
                    };
                    containerMiniaturas.appendChild(imgMini);
                });
                containerMiniaturas.style.display = 'flex';
            } else {
                containerMiniaturas.style.display = 'none';
            }

            document.getElementById('modal-produto').style.display = 'flex';
        }

        function mudarFotoDestaque(linkDaMiniatura, elementoClicado) {
            document.getElementById('foto-grande').src = linkDaMiniatura;
            const minis = document.querySelectorAll('.miniatura');
            minis.forEach(m => m.classList.remove('ativa'));
            elementoClicado.classList.add('ativa');
        }

        function fecharModal() {
            document.getElementById('modal-produto').style.display = 'none';
        }

        function fecharModalExterno(event) {
            if (event.target.id === 'modal-produto') {
                fecharModal();
            }
        }

        window.onload = carregarVitrineWeb;