/**
 * Véluna Representações - Core Application v7.0 (Fixed)
 * Tech Lead: Gemini
 */

'use strict';

const VelunaApp = {
    config: {
        whatsappNumber: '5541997114692',
        currency: 'BRL',
        locale: 'pt-BR'
    },

    state: {
        isMobileMenuOpen: false,
        isCartOpen: false,
        allProducts: [],
        cart: [] 
    },

    init() {
        // 1. Carrega Produtos
        if (typeof window.produtosVeluna !== 'undefined') {
            this.state.allProducts = window.produtosVeluna;
        } else {
            console.error('❌ Data.js não carregado.');
        }

        // 2. Carrega Carrinho Salvo
        this.loadCart();

        // 3. Inicializa UI
        this.setupHeader();
        this.setupMobileMenu();
        this.setupCartUI();
        this.setupVitrine();
        this.setupMarcas();
        this.setupNewsletter();
        
        // 4. Verifica se está na página de produto
        const urlParams = new URLSearchParams(window.location.search);
        const produtoId = urlParams.get('id');
        if (produtoId) {
            this.loadProductPage(produtoId);
        }

        this.updateCartUI();
    },

    // ============================================================
    // GERENCIAMENTO DO CARRINHO (DATA & LOGIC)
    // ============================================================

    loadCart() {
        const savedCart = localStorage.getItem('veluna_cart');
        if (savedCart) {
            this.state.cart = JSON.parse(savedCart);
            this.updateCartUI();
        }
    },

    saveCart() {
        localStorage.setItem('veluna_cart', JSON.stringify(this.state.cart));
        this.updateCartUI();
    },

    addToCart(id) {
        const produto = this.state.allProducts.find(p => p.id == id);
        
        const btnSelecionado = document.querySelector('.size-btn.selected');
        if (!btnSelecionado) {
            alert("Por favor, selecione um tamanho.");
            return;
        }
        const tamanhoSelecionado = btnSelecionado.textContent;

        const itemExistente = this.state.cart.find(item => item.id === id && item.tamanho === tamanhoSelecionado);

        if (itemExistente) {
            itemExistente.quantidade++;
        } else {
            this.state.cart.push({
                id: produto.id,
                nome: produto.nome,
                marca: produto.marca,
                preco: produto.preco,
                tamanho: tamanhoSelecionado,
                imagem: produto.imagem,
                quantidade: 1
            });
        }

        this.saveCart(); // Salva no LocalStorage
        this.openCart(); // Abre o carrinho visualmente
    },

    removeFromCart(index) {
        this.state.cart.splice(index, 1);
        this.saveCart();
    },

    // ============================================================
    // INTERFACE DO CARRINHO (UI)
    // ============================================================
    
    setupCartUI() {
        const openBtns = document.querySelectorAll('.js-open-cart');
        const closeBtn = document.querySelector('.close-cart');
        const overlay = document.getElementById('cart-overlay');
        const checkoutBtn = document.getElementById('checkout-btn');

        openBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleCart(true);
                if(this.state.isMobileMenuOpen) {
                    // Fecha menu mobile se estiver aberto
                    const menuToggle = document.querySelector('.mobile-menu-toggle');
                    if(menuToggle) menuToggle.click(); 
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
            sidebar?.classList.add('open');
            overlay?.classList.add('open');
            document.body.classList.add('body-no-scroll');
            this.renderCartItems();
        } else {
            sidebar?.classList.remove('open');
            overlay?.classList.remove('open');
            document.body.classList.remove('body-no-scroll');
        }
    },

    renderCartItems() {
        const container = document.getElementById('cart-items');
        const totalEl = document.getElementById('cart-total-value'); // Verifique se o ID no HTML é este ou 'cart-total'
        
        if (!container) return;

        container.innerHTML = '';
        let total = 0;

        if (this.state.cart.length === 0) {
            container.innerHTML = '<div class="empty-cart-msg">Seu carrinho está vazio.</div>';
            if(totalEl) totalEl.textContent = 'R$ 0,00';
            return;
        }

        this.state.cart.forEach((item, index) => {
            const subtotal = item.preco * item.quantidade;
            total += subtotal;
            
            const div = document.createElement('div');
            div.className = 'cart-item';
            
            // Exibe Marca se existir
            const marcaHtml = item.marca ? `<span style="font-size: 0.75rem; color: #888;">${item.marca}</span>` : '';

            div.innerHTML = `
                <img src="${item.imagem}" alt="${item.nome}">
                <div class="cart-item-info">
                    ${marcaHtml}
                    <span class="cart-item-title">${item.nome}</span>
                    <span style="font-size: 0.8rem; display:block;">Tam: <strong>${item.tamanho}</strong> | Qtd: ${item.quantidade}</span>
                    <span class="cart-item-price">${this.formatPrice(subtotal)}</span>
                </div>
                <button class="remove-btn" onclick="VelunaApp.removeFromCart(${index})" style="background:none; border:none; color:red; font-size:1.2rem; cursor:pointer;">&times;</button>
            `;
            container.appendChild(div);
        });

        if(totalEl) totalEl.textContent = this.formatPrice(total);
    },

    openCart() {
        this.toggleCart(true);
    },

 updateCartUI() {
        const countElements = document.querySelectorAll('.cart-count-display');
        const totalItems = this.state.cart.reduce((acc, item) => acc + item.quantidade, 0);

        countElements.forEach(el => {
            el.textContent = totalItems;
            
            // Lógica Inteligente:
            if (el.closest('.cart-header')) {
                // No Header do Carrinho lateral: ESCONDE (já temos o título fixo)
                el.style.display = 'none'; 
            } else {
                // No Menu Mobile ou Ícones: MOSTRA a bolinha se tiver item
                el.style.display = totalItems > 0 ? 'inline-block' : 'none';
            }
        });

        // Se o carrinho estiver aberto, atualiza a lista de produtos também
        if (this.state.isCartOpen) {
            this.renderCartItems();
        }
    },

    // ============================================================
    // CHECKOUT WHATSAPP
    // ============================================================

    checkoutWhatsApp() {
        if (this.state.cart.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }

        let mensagem = "Olá! Gostaria de finalizar o seguinte pedido feito no site:\n\n";
        let total = 0;

        this.state.cart.forEach(item => {
            const subtotal = item.preco * item.quantidade;
            total += subtotal;
            
            const marcaDisplay = item.marca ? `*${item.marca}* | ` : ''; 
            mensagem += `- ${marcaDisplay}${item.nome} (${item.tamanho}) x${item.quantidade}: ${this.formatPrice(subtotal)}\n`;
        });

        mensagem += `\n*Valor Total: ${this.formatPrice(total)}*`;
        mensagem += `\n\nFico no aguardo para combinar o pagamento e envio!`;

        const link = `https://wa.me/${this.config.whatsappNumber}?text=${encodeURIComponent(mensagem)}`;
        window.open(link, '_blank');
    },

    // ============================================================
    // PÁGINA DE PRODUTO & MÍDIAS
    // ============================================================
loadProductPage(id) {
        const produto = this.state.allProducts.find(p => p.id == id);
        const container = document.getElementById('product-detail-area');

        if (!produto || !container) return;

        // ... (Parte das Mídias continua igual) ...
        const midias = (produto.galeria && produto.galeria.length > 0) ? produto.galeria : [produto.imagem];

        // LOGICA DOS BOTÕES E TAMANHOS
        let areaCompraHTML = '';

        if (produto.esgotado) {
            // SE ESTIVER ESGOTADO:
            areaCompraHTML = `
                <span class="esgotado-msg">Produto Indisponível no Momento</span>
                <button class="btn-gold btn-block btn-esgotado" disabled>
                    ESGOTADO
                </button>
            `;
        } else {
            // SE TIVER ESTOQUE (Código Normal):
            // 1. Define Tamanhos
            let gradeTamanhos = [];
            let labelTamanho = 'Tamanho';
            const roupas = ['vestuario', 'camisetas', 'shorts', 'moletons', 'calcas', 'jaquetas', 'conjuntos'];
            
            if (produto.categoria === 'sneakers') {
                labelTamanho = 'Escolha a Numeração (BR)';
                gradeTamanhos = ['38', '39', '40', '41', '42', '43'];
            } else if (roupas.includes(produto.categoria && produto.categoria.toLowerCase())) {
                labelTamanho = 'Escolha o Tamanho';
                gradeTamanhos = ['P', 'M', 'G', 'GG', 'XG'];
            } else {
                gradeTamanhos = ['Único'];
            }

            areaCompraHTML = `
                <div class="size-selector">
                    <span class="size-label">${labelTamanho}</span>
                    <div class="sizes-grid" id="sizes-grid">
                        ${gradeTamanhos.map(t => `<button class="size-btn" onclick="VelunaApp.selecionarTamanho(this)">${t}</button>`).join('')}
                    </div>
                </div>

                <button class="btn-gold btn-block" onclick="VelunaApp.addToCart(${produto.id})">
                    Adicionar ao Carrinho
                </button>
            `;
        }

        // Renderiza tudo
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
                
                <div class="p-description">
                    <p>Peça exclusiva ${produto.marca}.</p>
                </div>

                ${areaCompraHTML}
            </div>
        `;
    },

    gerarHTMLMidia(url, autoplay = false) {
        if (!url) return '';
        const urlLower = url.toLowerCase();
        const isVideo = urlLower.endsWith('.mp4') || urlLower.endsWith('.mov');

        if (isVideo) {
            return `<video src="${url}" class="media-element fade-in" controls controlsList="nodownload" ${autoplay ? 'autoplay muted' : ''} loop playsinline></video>`;
        } else {
            return `<img src="${url}" class="media-element fade-in" alt="Produto Véluna">`;
        }
    },

    gerarHTMLThumb(url) {
        if (!url) return '';
        const urlLower = url.toLowerCase();
        const isVideo = urlLower.endsWith('.mp4') || urlLower.endsWith('.mov');

        if (isVideo) {
            return `<div class="thumb-video-icon"><i class="fas fa-play"></i></div>`;
        } else {
            return `<img src="${url}" alt="thumb">`;
        }
    },

    trocarMidia(url, elementoThumb) {
        document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
        elementoThumb.classList.add('active');
        const stage = document.getElementById('main-stage');
        stage.innerHTML = this.gerarHTMLMidia(url, true);
    },

    selecionarTamanho(btn) {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    },

    // ============================================================
    // VITRINE & FILTROS
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

   renderProducts(lista, container) {
        container.innerHTML = '';
        if (lista.length === 0) {
            container.innerHTML = '<div style="text-align:center; grid-column:1/-1; padding:40px;">Nenhum produto encontrado.</div>';
            return;
        }

        lista.forEach(produto => {
            let badgeClass = '';
            let badgeText = '';
            let cardClass = 'product-card';
            
            // Variável para guardar o HTML do overlay
            let esgotadoOverlayHTML = ''; 

            if (produto.esgotado) {
                // 1. Configura classe do card
                cardClass += ' esgotado';
                
                // 2. Cria o HTML do texto por cima da imagem
                esgotadoOverlayHTML = `
                    <div class="esgotado-overlay">
                        <span>ESGOTADO</span>
                    </div>
                `;
                
                // (Opcional) Se quiser manter a badge do canto também:
                badgeClass = 'badge-esgotado';
                badgeText = 'Indisponível';

            } else if (produto.tipo === 'pronta-entrega') {
                badgeClass = 'badge-pronta';
                badgeText = 'Pronta Entrega';
            } else {
                badgeClass = 'badge-encomenda';
                badgeText = 'Sob Encomenda';
            }

            const card = document.createElement('div');
            card.className = cardClass;
            
            // AQUI É A MÁGICA: Inserimos o ${esgotadoOverlayHTML} logo depois da imagem
            card.innerHTML = `
                <div style="position: relative; overflow: hidden;">
                    <span class="product-badge ${badgeClass}">${badgeText}</span>
                    
                    <a href="produto.html?id=${produto.id}" style="display:block;">
                        <img src="${produto.imagem}" alt="${produto.nome}" loading="lazy">
                        ${esgotadoOverlayHTML} 
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

    filtrar(categoria, botaoClicado) {
        if (botaoClicado) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            botaoClicado.classList.add('active');
        }

        const container = document.getElementById('vitrine-produtos') || document.getElementById('vitrine-destaques');
        if (!container) return;

        const urlParams = new URLSearchParams(window.location.search);
        const marcaAtual = urlParams.get('marca');
        const filtroAtual = urlParams.get('filtro');

        let listaBase = this.state.allProducts;

        if (marcaAtual) {
            listaBase = listaBase.filter(p => p.marca.toLowerCase() === marcaAtual.toLowerCase());
        }
        if (filtroAtual === 'pronta-entrega') {
            listaBase = listaBase.filter(p => p.tipo === 'pronta-entrega');
        }

        let resultadoFinal;
        if (categoria === 'todos') {
            resultadoFinal = listaBase;
        } else {
            resultadoFinal = listaBase.filter(p => 
                p.categoria && p.categoria.toLowerCase() === categoria.toLowerCase()
            );
        }

        this.renderProducts(resultadoFinal, container);
    },

    // ============================================================
    // UTILS & SETUP
    // ============================================================

    formatPrice(valor) {
        return new Intl.NumberFormat(this.config.locale, { 
            style: 'currency', currency: this.config.currency 
        }).format(valor);
    },

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

        const btn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(btn, oldBtn);

        let overlay = document.getElementById('mobile-menu-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mobile-menu-overlay';
            document.body.appendChild(overlay);
        }

        const closeMenu = () => {
            this.state.isMobileMenuOpen = false;
            btn.classList.remove('active');
            menu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        btn.addEventListener('click', () => {
            const willOpen = !this.state.isMobileMenuOpen;
            if (willOpen) {
                this.state.isMobileMenuOpen = true;
                btn.classList.add('active');
                menu.classList.add('active');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                closeMenu();
            }
        });

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
