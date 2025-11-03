document.addEventListener('DOMContentLoaded', function() {
    // Funcionalidad del dropdown de contactos
    const contactToggle = document.getElementById('contactToggle');
    const contactDropdown = document.getElementById('contactDropdown');

    if (contactToggle && contactDropdown) {
        contactToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            contactToggle.classList.toggle('active');
            contactDropdown.classList.toggle('show');
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!contactToggle.contains(e.target) && !contactDropdown.contains(e.target)) {
                contactToggle.classList.remove('active');
                contactDropdown.classList.remove('show');
            }
        });
    }

    // Función para aplicar el filtro inicial basado en el botón activo
    function aplicarFiltroInicial() {
        const categoriaActiva = document.querySelector('.category-btn.active');
        if (categoriaActiva) {
            const categoria = categoriaActiva.getAttribute('data-category');
            const menuItems = document.querySelectorAll('.menu-item');

            menuItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');

                if (itemCategory === categoria) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        }
    }

    // Aplicar filtro inicial al cargar la página
    aplicarFiltroInicial();

    // Obtener botones de categoría
    const categoryButtons = document.querySelectorAll('.category-btn');

    // Agregar event listener a cada botón
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');

            // Actualizar botones activos
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filtrar elementos del menú
            const menuItems = document.querySelectorAll('.menu-item');

            menuItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');

                if (itemCategory === category) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Sistema de fallback para imágenes
    const images = document.querySelectorAll('.item-image img');

    images.forEach(img => {
        img.addEventListener('error', function() {
            // Si la imagen falla, usar una imagen de fallback
            if (!this.hasAttribute('data-fallback-tried')) {
                this.setAttribute('data-fallback-tried', 'true');

                // Lista de imágenes de fallback según el tipo de producto
                const fallbackImages = {
                    'default': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200&h=150&fit=crop&crop=center',
                    'sandwich': 'https://images.unsplash.com/photo-1553909489-cd47e7f8a8b1?w=200&h=150&fit=crop&crop=center',
                    'hotdog': 'https://images.unsplash.com/photo-1619739900579-98b55127fb47?w=200&h=150&fit=crop&crop=center',
                    'fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=150&fit=crop&crop=center',
                    'drink': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=150&fit=crop&crop=center'
                };

                // Determinar el tipo de fallback basado en el alt text
                const altText = this.alt.toLowerCase();
                let fallbackSrc = fallbackImages.default;

                if (altText.includes('sándwich') || altText.includes('sandwich')) {
                    fallbackSrc = fallbackImages.sandwich;
                } else if (altText.includes('completo') || altText.includes('hotdog')) {
                    fallbackSrc = fallbackImages.hotdog;
                } else if (altText.includes('papas') || altText.includes('fries') || altText.includes('salchipapas')) {
                    fallbackSrc = fallbackImages.fries;
                } else if (altText.includes('bebida') || altText.includes('café') || altText.includes('jugo') || altText.includes('drink')) {
                    fallbackSrc = fallbackImages.drink;
                }

                this.src = fallbackSrc;
            }
        });
    });
});