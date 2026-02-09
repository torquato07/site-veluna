/**
 * Véluna Representações - Core Application v6.0 (Cart System)
 * Tech Lead: Gemini
 */

'use strict';

const VelunaApp = {
    config: {
        whatsappNumber: '5541997114692', // Número Atualizado
        currency: 'BRL',
        locale: 'pt-BR'
    },

    state: {
        isMobileMenuOpen: false,
        isCartOpen: false,
        allProducts: [],
        cart: [] // Array que guarda os itens do carrinho
    },

    init() {
        // 1. Carrega Produtos
        if (typeof window.produtosVeluna !== 'undefined') {
            this.state.allProducts = window.produtosVeluna;
        } else {
            console.error('❌ Data.js não carregado.');
        }

        // 2. Carrega Carrinho Salvo (LocalStorage)
        this.loadCart();

        // 3. Inicializa Módulos UI
        this.setupHeader();
        this.setupMobileMenu();
        this.setupCartUI(); // Novo módulo do carrinho
        this.setupVitrine();
        this.setupMarcas();
        this.setupNewsletter();
        
        // Atualiza contador inicial
        this.updateCartCount();
    },

    // ============================================================
    // MÓDULO DO CARRINHO (CART SYSTEM)
    // ============================================================
    
    // Configura eventos de abrir/fechar e checkout
    setupCartUI() {
        // Agora buscamos por CLASSE (.js-open-cart), não mais por ID
        // Isso permite ter o botão no Header Desktop E no Menu Mobile ao mesmo tempo
        const openBtns = document.querySelectorAll('.js-open-cart');
        const closeBtn = document.querySelector('.close-cart');
        const overlay = document.getElementById('cart-overlay');
        const checkoutBtn = document.getElementById('checkout-btn');

        // Adiciona o evento de clique em TODOS os botões de abrir carrinho encontrados
        openBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleCart(true);
                // Fecha o menu mobile se estiver aberto, para melhor UX
                if(this.state.isMobileMenuOpen) {
                    document.querySelector('.mobile-menu-toggle').click(); 
                }
            });
        });

        if(closeBtn) closeBtn.addEventListener('click', () => this.toggleCart(false));
        if(overlay) overlay.addEventListener('click', () => this.toggleCart(false));

        if(checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.checkoutWhatsApp());
        }
    },

    toggleCart(show) {
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('cart-overlay');
        
        this.state.isCartOpen = show;
        
        if (show) {
            sidebar.classList.add('open');
            overlay.classList.add('open');
            document.body.classList.add('body-no-scroll');
            this.renderCartItems(); // Renderiza ao abrir
        } else {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
            document.body.classList.remove('body-no-scroll');
        }
    },

    // Adicionar item ao array e salvar
    addToCart(produtoId) {
        // 1. Verifica se estamos na página de detalhes (se existe seletor de tamanho)
        const sizeSelector = document.querySelector('.size-selector');
        const selectedBtn = document.querySelector('.size-btn.selected');
        let tamanhoFinal = 'N/A'; // Default para vitrine (sem tamanho)

        // Se houver seletor na tela, OBRIGA a escolher
        if (sizeSelector) {
            if (!selectedBtn) {
                alert("Por favor, selecione um tamanho antes de adicionar.");
                return; // PARE! Não adiciona nada.
            }
            tamanhoFinal = selectedBtn.textContent.trim();
        }

        // 2. Busca o produto original
        // (Usamos "==" para garantir que funcione com string ou number)
        const produtoOriginal = this.state.allProducts.find(p => p.id == produtoId);
        
        if (produtoOriginal) {
            // 3. CRIA UM NOVO OBJETO (Cópia)
            // Importante: Criamos uma cópia para adicionar o tamanho sem alterar o original
            const itemParaCarrinho = {
                ...produtoOriginal, // Copia todas as propriedades (id, nome, preco...)
                tamanhoSelecionado: tamanhoFinal // Adiciona a nova propriedade
            };

            this.state.cart.push(itemParaCarrinho);
            this.saveCart();
            this.updateCartCount();
            
            // Abre o carrinho para feedback visual
            this.toggleCart(true); 
        }
    },

    // Remover item pelo índice no array
    removeFromCart(index) {
        this.state.cart.splice(index, 1);
        this.saveCart();
        this.renderCartItems(); // Re-renderiza a lista
        this.updateCartCount();
    },

    // Desenha o HTML dentro do sidebar

    renderCartItems() {
        const container = document.getElementById('cart-items');
        const totalEl = document.getElementById('cart-total-value');
        
        container.innerHTML = '';
        let total = 0;

        if (this.state.cart.length === 0) {
            container.innerHTML = '<div class="empty-cart-msg">Seu carrinho está vazio.</div>';
            totalEl.textContent = 'R$ 0,00';
            return;
        }

        this.state.cart.forEach((item, index) => {
            total += item.preco;
            const precoFmt = this.formatPrice(item.preco);
            
            // Lógica para exibir o tamanho de forma elegante
            // Se for "N/A" (veio da vitrine), a gente não mostra nada para ficar limpo
            const htmlTamanho = item.tamanhoSelecionado && item.tamanhoSelecionado !== 'N/A' 
                ? `<span style="font-size: 0.75rem; color: #888; display:block; margin-top:2px;">Tamanho: <strong style="color: #bfa15f;">${item.tamanhoSelecionado}</strong></span>` 
                : '';

            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <img src="${item.imagem}" alt="${item.nome}">
                <div class="cart-item-info">
                    <span class="cart-item-title">${item.nome}</span>
                    ${htmlTamanho} <span class="cart-item-price">${precoFmt}</span>
                    <br>
                    <span class="remove-item" onclick="VelunaApp.removeFromCart(${index})">Remover</span>
                </div>
            `;
            container.appendChild(div);
        });

        totalEl.textContent = this.formatPrice(total);
    },

    // Enviar pedido para o WhatsApp
  checkoutWhatsApp() {
        if (this.state.cart.length === 0) {
            alert("Seu carrinho está vazio!");
            return;
        }

        let mensagem = "Olá Véluna! Gostaria de finalizar o seguinte pedido:\n\n";
        let total = 0;

        this.state.cart.forEach(item => {
            // Verifica se tem tamanho para formatar a string
            const txtTamanho = (item.tamanhoSelecionado && item.tamanhoSelecionado !== 'N/A') 
                ? ` [Tam: ${item.tamanhoSelecionado}]` 
                : '';

            mensagem += `▪️ ${item.nome}${txtTamanho} - ${this.formatPrice(item.preco)}\n`;
            total += item.preco;
        });

        // --- MUDANÇAS AQUI EMBAIXO ---
        mensagem += `\n*Subtotal:* ${this.formatPrice(total)}`;
        mensagem += `\n*Frete:* A calcular (Enviarei meu CEP)`; // Linha nova
        
        mensagem += `\n\nAguardo o cálculo do frete e link de pagamento.`;

        const link = `https://wa.me/${this.config.whatsappNumber}?text=${encodeURIComponent(mensagem)}`;
        window.open(link, '_blank');
    },
    // Persistência: LocalStorage
    saveCart() {
        localStorage.setItem('velunaCart', JSON.stringify(this.state.cart));
    },

    loadCart() {
        const saved = localStorage.getItem('velunaCart');
        if (saved) {
            this.state.cart = JSON.parse(saved);
        }
    },

updateCartCount() {
        // Atualiza TODOS os contadores da tela (seja no header ou no menu mobile)
        const countElements = document.querySelectorAll('.cart-count-display');
        
        countElements.forEach(el => {
            el.textContent = this.state.cart.length;
        });
    },

    formatPrice(valor) {
        return new Intl.NumberFormat(this.config.locale, { 
            style: 'currency', currency: this.config.currency 
        }).format(valor);
    },

    // ============================================================
    // MÓDULO DE VITRINE (Atualizado para botão "Adicionar")
    // ============================================================
    setupVitrine() {
        const containerHome = document.getElementById('vitrine-destaques');
        const containerFull = document.getElementById('vitrine-produtos');

        if (containerHome) {
            const destaques = this.state.allProducts.filter(p => p.destaque).slice(0, 4);
            this.renderProducts(destaques, containerHome);
        }

        if (containerFull) {
            this.handleVitrineLogic(containerFull);
        }
    },

    handleVitrineLogic(container) {
        const urlParams = new URLSearchParams(window.location.search);
        const marcaParam = urlParams.get('marca');
        const catParam = urlParams.get('cat');
        const filtroParam = urlParams.get('filtro');

        let produtos = [...this.state.allProducts];

        if (marcaParam) produtos = produtos.filter(p => p.marca.toLowerCase() === marcaParam.toLowerCase());
        else if (catParam) produtos = produtos.filter(p => p.categoria === catParam);
        else if (filtroParam === 'pronta-entrega') produtos = produtos.filter(p => p.tipo === 'pronta-entrega');

        this.renderProducts(produtos, container);
        
        // Setup Sort
        const sortSelect = document.getElementById('sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const tipo = e.target.value;
                let sorted = [...produtos];
                if (tipo === 'menor-preco') sorted.sort((a, b) => a.preco - b.preco);
                if (tipo === 'maior-preco') sorted.sort((a, b) => b.preco - a.preco);
                this.renderProducts(sorted, container);
            });
        }
    },
   // --- FUNÇÃO DE FILTRO INTELIGENTE (CORRIGIDA) ---
    filtrar(categoria, botaoClicado) {
        // 1. Atualiza visual dos botões
        if (botaoClicado) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            botaoClicado.classList.add('active');
        }

        const container = document.getElementById('vitrine-produtos') || document.getElementById('vitrine-destaques');
        if (!container) return;

        // 2. RECUPERA O CONTEXTO ATUAL (URL)
        // Antes de filtrar categoria, verificamos se o usuário está numa página de marca ou pronta-entrega
        const urlParams = new URLSearchParams(window.location.search);
        const marcaAtual = urlParams.get('marca');
        const filtroAtual = urlParams.get('filtro'); // ex: pronta-entrega

        // 3. Começa com todos os produtos
        let listaBase = this.state.allProducts;

        // 4. Aplica os filtros da URL primeiro (O "Funil" da Marca)
        if (marcaAtual) {
            listaBase = listaBase.filter(p => p.marca.toLowerCase() === marcaAtual.toLowerCase());
        }
        if (filtroAtual === 'pronta-entrega') {
            listaBase = listaBase.filter(p => p.tipo === 'pronta-entrega');
        }

        // 5. Agora sim, aplica o filtro dos botões (Categoria) nessa lista já filtrada
        let resultadoFinal;

        if (categoria === 'todos') {
            resultadoFinal = listaBase;
        } else {
            resultadoFinal = listaBase.filter(p => 
                p.categoria && p.categoria.toLowerCase() === categoria.toLowerCase()
            );
        }

        // 6. Desenha na tela
        this.renderProducts(resultadoFinal, container);
    },
    // --- MÓDULO PÁGINA DE PRODUTO (NOVO) ---
 // --- FUNÇÃO PÁGINA DE PRODUTO (HÍBRIDA) ---
    loadProductPage(id) {
        const produto = this.state.allProducts.find(p => p.id == id);
        const container = document.getElementById('product-detail-area');

        if (!produto || !container) return;

        // 1. Mídias
        const midias = (produto.galeria && produto.galeria.length > 0) ? produto.galeria : [produto.imagem];

        // 2. Define a Grade de Tamanhos Padrão (Baseado na categoria)
        let gradeTamanhos = [];
        let labelTamanho = 'Tamanho';
        
        // Categorias de Roupas
        const roupas = ['vestuario', 'camisetas', 'shorts', 'moletons', 'calcas', 'jaquetas', 'conjuntos'];
        
        if (produto.categoria === 'sneakers') {
            labelTamanho = 'Selecionar Tamanho (BR)';
            gradeTamanhos = ['38', '39', '40', '41', '42', '43'];
        } else if (roupas.includes(produto.categoria.toLowerCase())) {
            labelTamanho = 'Selecionar Tamanho';
            gradeTamanhos = ['P', 'M', 'G', 'GG', 'XG'];
        } else {
            gradeTamanhos = ['Único'];
        }

        // 3. Renderiza a Estrutura HTML
        container.innerHTML = `
            <div class="p-image-col">
                <div class="main-media-stage" id="main-stage">
                    ${this.gerarHTMLMidia(midias[0], true)} 
                </div>
                <div class="gallery-thumbs" id="gallery-thumbs" style="${midias.length <= 1 ? 'display:none' : ''}">
                    ${midias.map((url, index) => `
                        <div class="thumb-item ${index === 0 ? 'active' : ''}" onclick="VelunaApp.trocarMidia('${url}', this)">
                            ${this.gerarHTMLThumb(url)}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="p-info-col">
                <span class="p-brand">${produto.marca}</span>
                <h1 class="p-title">${produto.nome}</h1>
                <div class="p-price">${this.formatPrice(produto.preco)}</div>
                
                <div id="stock-mode-area"></div>

                <div class="p-description">
                    <p>Item exclusivo ${produto.marca}. Selecione a modalidade de envio para ver a disponibilidade.</p>
                </div>

                <div class="size-selector">
                    <span class="size-label">${labelTamanho}</span>
                    <div class="sizes-grid" id="sizes-grid">
                        </div>
                </div>

                <button class="btn-gold btn-block" onclick="VelunaApp.addToCart(${produto.id})">
                    Adicionar ao Carrinho
                </button>
            </div>
        `;

        // 4. LÓGICA DO SISTEMA HÍBRIDO
        const stockArea = document.getElementById('stock-mode-area');
        const sizesGrid = document.getElementById('sizes-grid');
        
        // Verifica se existe o campo estoqueBr no data.js
        const temEstoqueBR = produto.estoqueBr && Array.isArray(produto.estoqueBr) && produto.estoqueBr.length > 0;

        // Função que desenha os botões (P, M, G...)
        const renderSizes = (modo) => {
            sizesGrid.innerHTML = ''; // Limpa tudo antes de desenhar
            
            gradeTamanhos.forEach(tamanho => {
                const btn = document.createElement('button');
                btn.className = 'size-btn';
                btn.textContent = tamanho;

                // SE ESTIVER NO MODO "PRONTA ENTREGA" -> APLICA O FILTRO
                if (modo === 'pronta-entrega' && temEstoqueBR) {
                    // Verifica se o tamanho atual existe na lista estoqueBr
                    // (Usa toLowerCase para garantir que "m" seja igual a "M")
                    const disponivel = produto.estoqueBr.some(t => t.toLowerCase() === tamanho.toLowerCase());
                    
                    if (!disponivel) {
                        btn.classList.add('disabled'); // Adiciona classe que risca e bloqueia
                        btn.title = "Indisponível para Pronta Entrega";
                    }
                }

                // Evento de Clique (Selecionar Tamanho)
                btn.onclick = function() {
                    // Se estiver riscado, não faz nada
                    if (this.classList.contains('disabled')) return;
                    
                    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
                    this.classList.add('selected');
                };

                sizesGrid.appendChild(btn);
            });
        };

        // 5. Configura os Botões de Alternância (Só aparecem se tiver estoqueBr)
        if (temEstoqueBR) {
            stockArea.innerHTML = `
                <div class="stock-mode-selector">
                    <button class="mode-btn active" id="btn-pe">Pronta Entrega </button>
                    <button class="mode-btn" id="btn-enc">Sob Encomenda </button>
                </div>
            `;

            const btnPE = document.getElementById('btn-pe');
            const btnEnc = document.getElementById('btn-enc');

            // Clique em Pronta Entrega
            btnPE.onclick = () => {
                btnPE.classList.add('active');
                btnEnc.classList.remove('active');
                renderSizes('pronta-entrega'); // Chama a função bloqueando tamanhos
            };

            // Clique em Encomenda
            btnEnc.onclick = () => {
                btnEnc.classList.add('active');
                btnPE.classList.remove('active');
                renderSizes('encomenda'); // Chama a função liberando tudo
            };

            // INICIALIZAÇÃO: Começa filtrando por Pronta Entrega
            renderSizes('pronta-entrega');

        } else {
            // Se o produto NÃO tiver estoqueBr definido, desenha normal (tudo liberado)
            renderSizes('padrao');
        }
    },

    // --- FUNÇÕES AUXILIARES DA GALERIA (COLE LOGO ABAIXO DA LOADPRODUCTPAGE) ---

    // Gera o HTML do Palco (Detecta MP4 vs Imagem Normal)
    gerarHTMLMidia(url, autoplay = false) {
        const urlLower = url.toLowerCase();
        // Se terminar com mp4 é vídeo, senão é imagem (JPG, PNG, JPEG, WEBP...)
        const isVideo = urlLower.endsWith('.mp4') || urlLower.endsWith('.mov');

        if (isVideo) {
            // Vídeo em loop, sem som, tocando automático
            return `<video src="${url}" class="media-element fade-in" controls controlsList="nodownload" ${autoplay ? 'autoplay muted' : ''} loop playsinline></video>`;
        } else {
            // Imagem Normal
            return `<img src="${url}" class="media-element fade-in" alt="Detalhe Produto">`;
        }
    },

    // Gera a miniatura pequena
    gerarHTMLThumb(url) {
        const urlLower = url.toLowerCase();
        const isVideo = urlLower.endsWith('.mp4') || urlLower.endsWith('.mov');

        if (isVideo) {
            // Ícone de Play para identificar vídeo
            return `<div class="thumb-video-icon"><i class="fas fa-play"></i></div>`;
        } else {
            return `<img src="${url}" alt="thumb">`;
        }
    },

    // Troca a imagem principal ao clicar na miniatura
    trocarMidia(url, elementoThumb) {
        // Remove a borda dourada de todos
        document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
        // Adiciona borda no clicado
        elementoThumb.classList.add('active');

        // Troca o conteúdo principal
        const stage = document.getElementById('main-stage');
        stage.innerHTML = this.gerarHTMLMidia(url, true); // true = dá play se for vídeo
    },

    setupSizeButtons(container) {
        const btns = container.querySelectorAll('.size-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', function() {
                btns.forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
            });
        });
    },
    renderProducts(lista, container) {
        container.innerHTML = '';
        if (lista.length === 0) {
            container.innerHTML = '<div style="text-align:center; grid-column:1/-1; padding:40px;">Nenhum produto encontrado.</div>';
            return;
        }

        // Dentro de renderProducts(lista, container) ...

    lista.forEach(produto => {
        const badgeClass = produto.tipo === 'pronta-entrega' ? 'badge-pronta' : 'badge-encomenda';
        const badgeText = produto.tipo === 'pronta-entrega' ? 'Pronta Entrega' : 'Sob Encomenda';

        const card = document.createElement('div');
        card.className = 'product-card';
        
        // REMOVEMOS O <BUTTON> DAQUI
        // Agora só existe o link na imagem que leva para a página de detalhes
        card.innerHTML = `
            <div style="position: relative; overflow: hidden;">
                <span class="product-badge ${badgeClass}">${badgeText}</span>
                <a href="produto.html?id=${produto.id}" style="display:block;">
                    <img src="${produto.imagem}" alt="${produto.nome}" loading="lazy">
                </a>
            </div>
            
            <div class="product-info">
                <span class="product-brand">${produto.marca}</span>
                <a href="produto.html?id=${produto.id}" style="text-decoration:none; color:inherit;">
                    <h3 class="product-name">${produto.nome}</h3>
                </a>
                <div class="product-price">${this.formatPrice(produto.preco)}</div>
            </div>
        `;
        container.appendChild(card);
    });
    },

    // ============================================================
    // OUTROS MÓDULOS (Mantidos)
    // ============================================================
    setupMarcas() {
        const container = document.getElementById('lista-marcas');
        if (!container) return;
        const marcasList = [...new Set(this.state.allProducts.map(p => p.marca))].sort();
        container.innerHTML = '';
        marcasList.forEach(marca => {
            const card = document.createElement('a');
            card.className = 'brand-card';
            card.href = `vitrine.html?marca=${encodeURIComponent(marca)}`;
            card.textContent = marca;
            container.appendChild(card);
        });
    },

    setupHeader() {
        const header = document.getElementById('main-header');
        if (header) window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 50));
    },

    setupMobileMenu() {
        const oldBtn = document.querySelector('.mobile-menu-toggle');
        const menu = document.querySelector('.nav-menu');
        
        if (!oldBtn || !menu) return;

        // 1. Substituição do botão (Clonagem para limpar eventos antigos)
        // Isso evita bugs se a função for chamada duas vezes
        const btn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(btn, oldBtn);

        // 2. Setup do Overlay (Cortina Escura)
        let overlay = document.getElementById('mobile-menu-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mobile-menu-overlay';
            document.body.appendChild(overlay);
        }

        // 3. Função Centralizada de Fechar
        // (Garante que remove a classe 'active' do botão certo)
        const closeMenu = () => {
            this.state.isMobileMenuOpen = false;
            
            btn.classList.remove('active');     // X vira Hambúrguer
            menu.classList.remove('active');    // Recolhe Menu
            overlay.classList.remove('active'); // Some Cortina
            
            document.body.style.overflow = '';  // Destrava Scroll
        };

        // 4. Evento: Clicar no X ou no Hambúrguer
        btn.addEventListener('click', () => {
            const willOpen = !this.state.isMobileMenuOpen;
            
            if (willOpen) {
                // ABRIR
                this.state.isMobileMenuOpen = true;
                btn.classList.add('active');
                menu.classList.add('active');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                // FECHAR
                closeMenu();
            }
        });

        // 5. Evento: Clicar Fora (Overlay)
        overlay.addEventListener('click', closeMenu);
    },

    setupNewsletter() {
        document.querySelectorAll('.newsletter-form').forEach(f => {
            f.addEventListener('submit', (e) => {
                e.preventDefault();
                alert("Obrigado pelo cadastro!");
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => VelunaApp.init());