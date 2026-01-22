/**
 * Véluna Database (Simulação)
 * Instruções para Edição Manual:
 * 1. Mantenha os IDs únicos.
 * 2. Preço deve ser numero (ponto flutuante), não string (ex: 1599.90).
 * 3. Categorias exatas usadas no site: 'sneakers', 'vestuario', 'acessorios'.
 * 4. Tipo: 'pronta-entrega' (Badge Dourado) ou 'encomenda' (Badge Escuro).
 * 5. Destaque: true (Aparece na Home) ou false (Apenas na Vitrine).
 */

window.produtosVeluna = [
    // --- SNEAKERS ---
    {
        id: 1,
        nome: "Air Jordan 1 High 'Dark Mocha'",
        marca: "Jordan",
        preco: 3499.00,
        imagem: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=800&auto=format&fit=crop",
        categoria: "sneakers",
        tipo: "pronta-entrega",
        destaque: true
    },
    {
        id: 2,
        nome: "Yeezy Boost 350 V2 'Onyx'",
        marca: "Adidas",
        preco: 1890.00,
        imagem: "https://images.unsplash.com/photo-1617614839843-08638686e9e3?q=80&w=800&auto=format&fit=crop",
        categoria: "sneakers",
        tipo: "encomenda",
        destaque: false
    },
    {
        id: 3,
        nome: "Off-White x Nike Dunk Low",
        marca: "Off-White",
        preco: 4500.00,
        imagem: "https://images.unsplash.com/photo-1608667508764-33cf0726b13a?q=80&w=800&auto=format&fit=crop",
        categoria: "sneakers",
        tipo: "pronta-entrega",
        destaque: true
    },
    {
        id: 4,
        nome: "Balenciaga Track Sneaker",
        marca: "Balenciaga",
        preco: 8200.00,
        imagem: "https://images.unsplash.com/photo-1647463518386-829283770141?q=80&w=800&auto=format&fit=crop",
        categoria: "sneakers",
        tipo: "encomenda",
        destaque: false
    },

    // --- VESTUÁRIO ---
    {
        id: 5,
        nome: "Essentials Fear of God Hoodie",
        marca: "Fear of God",
        preco: 1200.00,
        imagem: "https://images.unsplash.com/photo-1571513722275-4b41940954b3?q=80&w=800&auto=format&fit=crop",
        categoria: "vestuario",
        tipo: "pronta-entrega",
        destaque: true
    },
    {
        id: 6,
        nome: "Palm Angels Oversized Tee",
        marca: "Palm Angels",
        preco: 2100.00,
        imagem: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=800&auto=format&fit=crop",
        categoria: "vestuario",
        tipo: "encomenda",
        destaque: false
    },
    {
        id: 7,
        nome: "Supreme Box Logo Crewneck",
        marca: "Supreme",
        preco: 2800.00,
        imagem: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?q=80&w=800&auto=format&fit=crop",
        categoria: "vestuario",
        tipo: "encomenda",
        destaque: false
    },

    // --- ACESSÓRIOS ---
    {
        id: 8,
        nome: "Louis Vuitton Keepall 55",
        marca: "Louis Vuitton",
        preco: 14500.00,
        imagem: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop",
        categoria: "acessorios",
        tipo: "encomenda",
        destaque: true
    },
    {
        id: 9,
        nome: "Gucci GG Marmont Belt",
        marca: "Gucci",
        preco: 2900.00,
        imagem: "https://images.unsplash.com/photo-1622325390974-9226cb493732?q=80&w=800&auto=format&fit=crop",
        categoria: "acessorios",
        tipo: "pronta-entrega",
        destaque: false
    },
    {
        id: 10,
        nome: "Rolex Submariner Date",
        marca: "Rolex",
        preco: 85000.00,
        imagem: "https://images.unsplash.com/photo-1614777593259-7bc33e0859a7?q=80&w=800&auto=format&fit=crop",
        categoria: "acessorios",
        tipo: "encomenda",
        destaque: false
    }
];