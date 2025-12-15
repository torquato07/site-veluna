/**
 * Veluna Luxury Retail - Main Application Script
 * Architecture: Modular Namespace Pattern
 * Author: Senior Frontend Architect
 * Version: 2.1.0 (Com Auto-Marcas Integrado)
 */

'use strict';

const VelunaApp = {
    // ⚙️ Configurações Globais
    config: {
        headerThreshold: 50, // Scroll necessário para mudar o header
        carouselInterval: 6000, // Tempo de troca dos slides (6s)
        currency: 'BRL'
    },

    // 📦 Estado da Aplicação
    state: {
        isMobileMenuOpen: false,
        cartCount: 0
    },

    /**
     * 🚀 Inicializador Mestre
     * Dispara todos os módulos assim que o DOM estiver pronto.
     */
    init() {
        console.log('Veluna App: Initializing Luxury Experience...');
        
        this.setupHeader();
        this.setupMobileMenu();
        this.setupHeroCarousel();
        this.setupVitrine();
        this.setupMarcas(); // <--- Função nova adicionada aqui
        this.setupNewsletter();
        this.setupScrollAnimations();
    },

    /**
     * 1. HEADER & SCROLL UX
     * Controla a transparência e o comportamento sticky do cabeçalho.
     */
    setupHeader() {
        const header = document.getElementById('main-header');
        if (!header) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > this.config.headerThreshold) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });
    },

    /**
     * 2. MOBILE NAVIGATION (Versão Corrigida UX)
     * Fecha ao clicar fora ou ao clicar em um link.
     */
    setupMobileMenu() {
        const btn = document.querySelector('.mobile-menu-toggle');
        const menu = document.querySelector('.nav-menu');
        
        if (!btn || !menu) return;

        // Função interna para abrir/fechar
        const toggleMenu = (forceClose = false) => {
            const shouldClose = forceClose || this.state.isMobileMenuOpen;

            if (shouldClose) {
                // FECHAR
                this.state.isMobileMenuOpen = false;
                btn.classList.remove('active');
                menu.classList.remove('active');
                document.body.style.overflow = ''; // Destrava rolagem
            } else {
                // ABRIR
                this.state.isMobileMenuOpen = true;
                btn.classList.add('active');
                menu.classList.add('active');
                document.body.style.overflow = 'hidden'; // Trava rolagem
            }
            
            btn.setAttribute('aria-expanded', this.state.isMobileMenuOpen);
        };

        // 1. Evento do Botão Hambúrguer
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o click no botão dispare o "click fora" imediatamente
            toggleMenu();
        });

        // 2. Evento: Clicar FORA do menu para fechar (Overlay behavior)
        document.addEventListener('click', (e) => {
            if (this.state.isMobileMenuOpen) {
                const clickInsideMenu = menu.contains(e.target);
                const clickOnBtn = btn.contains(e.target);

                if (!clickInsideMenu && !clickOnBtn) {
                    toggleMenu(true); // Força fechar
                }
            }
        });

        // 3. Evento: Clicar em qualquer LINK dentro do menu fecha ele
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                toggleMenu(true);
            });
        });
    },
    /**
     * 3. HERO CAROUSEL (COM SWIPE SUPPORT)
     * Lógica robusta para o banner principal.
     */
    setupHeroCarousel() {
        const slides = document.querySelectorAll('.slide');
        const container = document.querySelector('.hero-carousel');
        
        if (!slides.length || !container) return;

        let current = 0;
        let timer;
        let touchStartX = 0;

        // Função de Troca
        const changeSlide = (next = true) => {
            slides[current].classList.remove('active');
            
            if (next) {
                current = (current + 1) % slides.length;
            } else {
                current = (current - 1 + slides.length) % slides.length;
            }
            
            slides[current].classList.add('active');
        };

        // Timer Automático
        const startTimer = () => {
            if (timer) clearInterval(timer);
            timer = setInterval(() => changeSlide(true), this.config.carouselInterval);
        };
        
        const stopTimer = () => clearInterval(timer);

        // Inicializa
        startTimer();

        // Eventos de Mouse
        container.addEventListener('mouseenter', stopTimer);
        container.addEventListener('mouseleave', startTimer);

        // Eventos de Touch (Swipe para Mobile)
        container.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
            stopTimer();
        }, { passive: true });

        container.addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) changeSlide(true); // Swipe Left
                else changeSlide(false); // Swipe Right
            }
            startTimer();
        });
    },

    /**
     * 4. VITRINE ENGINE
     * Renderiza produtos, aplica filtros e formata preços.
     */
    setupVitrine() {
        const container = document.getElementById('vitrine-produtos');
        if (!container) return; // Não estamos na página da vitrine

        // Verifica segurança do Database
        const produtos = window.estoqueVeluna || [];
        
        if (produtos.length === 0) {
            this.utils.renderError(container, 'Nenhum produto disponível no momento.');
            return;
        }

        // Detecta Filtros na URL
        const urlParams = new URLSearchParams(window.location.search);
        const filtroMarca = urlParams.get('marca');
        
        let produtosFiltrados = produtos;

        if (filtroMarca) {
            const marcaLimpa = decodeURIComponent(filtroMarca);
            produtosFiltrados = produtos.filter(p => p.marca === marcaLimpa);
            this.utils.updatePageTitle(marcaLimpa);
        }

        // Renderização Final
        container.innerHTML = '';
        
        if (produtosFiltrados.length === 0) {
            this.utils.renderError(container, `Não encontramos itens da coleção <strong>${filtroMarca}</strong>.`);
            return;
        }

        produtosFiltrados.forEach(produto => {
            container.innerHTML += this.templates.productCard(produto);
        });
    },

    /**
     * 5. MARCAS AUTOMÁTICAS (INTEGRADA)
     * Gera o grid de marcas baseado no database.
     */
    setupMarcas() {
        const container = document.getElementById('lista-marcas');
        if (!container) return; // Não estamos na página de marcas

        const produtos = window.estoqueVeluna || [];
        
        // Extrai apenas os nomes das marcas e remove duplicatas
        const marcasUnicas = [...new Set(produtos.map(p => p.marca))].sort();

        container.innerHTML = ''; // Limpa o loading

        if (marcasUnicas.length === 0) {
            container.innerHTML = '<p style="color:#fff; grid-column: 1/-1; text-align: center;">Nenhuma marca encontrada.</p>';
            return;
        }

        marcasUnicas.forEach(marca => {
            // Cria elemento DOM
            const link = document.createElement('a');
            link.className = 'brand-card';
            link.href = `vitrine.html?marca=${encodeURIComponent(marca)}`;
            link.innerText = marca;
            
            // Setup inicial de animação
            link.style.opacity = '0';
            link.style.transform = 'translateY(20px)';
            link.style.transition = 'all 0.3s ease, opacity 0.5s ease, transform 0.5s ease';
            
            container.appendChild(link);
            
            // Dispara animação
            setTimeout(() => {
                link.style.opacity = '1';
                link.style.transform = 'translateY(0)';
            }, 100);
        });
    }, // <--- AQUI ESTÁ A VÍRGULA IMPORTANTE QUE SEPARA AS FUNÇÕES

    /**
     * 6. NEWSLETTER
     */
    setupNewsletter() {
        const form = document.querySelector('.newsletter-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = form.querySelector('input');
            const btn = form.querySelector('button');
            const originalText = btn.innerText;

            if (!input.value) return;

            btn.innerText = 'Enviando...';
            btn.style.opacity = '0.7';

            setTimeout(() => {
                alert(`Bem-vindo ao Inner Circle, ${input.value}!`);
                input.value = '';
                btn.innerText = originalText;
                btn.style.opacity = '1';
            }, 1500);
        });
    },

    /**
     * 7. SCROLL ANIMATIONS
     */
    setupScrollAnimations() {
        const elements = document.querySelectorAll('.product-card, .category-card, .section-title');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        elements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            observer.observe(el);
        });
    },

    // 🛠️ UTILS & TEMPLATES
    utils: {
        formatCurrency(value) {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value);
        },

        updatePageTitle(marca) {
            const title = document.querySelector('.section-title');
            const pageHeaderP = document.querySelector('.page-header p');
            if (title) title.innerHTML = `Coleção <span style="color:var(--color-gold-primary)">${marca}</span>`;
            if (pageHeaderP) pageHeaderP.textContent = `A curadoria oficial da ${marca} no Brasil.`;
        },

        renderError(container, msg) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
                    <i class="fas fa-box-open" style="font-size: 3rem; color: #333; margin-bottom: 20px;"></i>
                    <p style="color: #ccc; font-size: 1.2rem;">${msg}</p>
                    <a href="vitrine.html" class="btn-gold" style="margin-top:20px">Ver Toda Coleção</a>
                </div>
            `;
        }
    },

    templates: {
        productCard(produto) {
            const preco = VelunaApp.utils.formatCurrency(produto.preco);
            const isPronta = produto.disponibilidade.toLowerCase().includes('pronta');
            const badgeClass = isPronta ? 'badge-pronta' : 'badge-encomenda';
            const badgeText = isPronta ? 'Pronta Entrega' : 'Encomenda';

            return `
                <article class="product-card" role="group" aria-label="${produto.nome}">
                    <div class="product-image-container">
                        <span class="product-badge ${badgeClass}">${badgeText}</span>
                        <img src="${produto.imagem}" alt="Foto de ${produto.nome}" loading="lazy">
                        <button class="btn-shop" onclick="alert('Item adicionado à sacola (Simulação)')">Ver Detalhes</button>
                    </div>
                    <div class="product-info">
                        <span class="product-brand">${produto.marca}</span>
                        <h3 class="product-name">${produto.nome}</h3>
                        <span class="product-price">${preco}</span>
                    </div>
                </article>
            `;
        }
    }
};

// 🔥 Ignition
document.addEventListener('DOMContentLoaded', () => {
    VelunaApp.init();
});