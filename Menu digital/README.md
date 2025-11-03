# 🍔 Food Truck Express - Menú Digital

¡Un menú digital llamativo y moderno para tu carro de comida rápida! Diseñado con colores vibrantes, animaciones atractivas y una experiencia de usuario excepcional.

## ✨ Características

### 🎨 Diseño Atractivo
- **Gradientes vibrantes** con colores naranjas, amarillos y púrpuras
- **Animaciones suaves** en todos los elementos interactivos
- **Efectos visuales** como hover, bounce, float y rotate
- **Diseño responsive** que se adapta a móviles y tablets
- **Efectos de vidrio** con backdrop-filter para un look moderno

### 📱 Funcionalidades Interactivas
- **Filtrado por categorías** (Comida, Bebidas)
- **Información de contacto** prominente para realizar pedidos
- **Indicadores de disponibilidad** para todos los productos
- **Scroll suave** entre secciones
- **Efectos hover** en todos los botones

### 🍽️ Menú Organizado
- **14 productos** en 2 categorías principales
- **Precios reales** del food truck chileno
- **Descripciones detalladas** de cada producto
- **Iconos representativos** para cada item
- **Indicadores de disponibilidad** para todos los productos

### 🥪 Especialidades Chilenas
- **Completos tradicionales** (Italiano, Dinámico, especiales)
- **Sándwiches premium** con ingredientes frescos
- **Chorrillanas variadas** (Tradicional, Bistec a lo Pobre, Marina)
- **Pichangas y salchipapas** para compartir

## 🚀 Cómo Usar

### Opción 1: Servidor Local (Recomendado)
```bash
# El servidor ya está ejecutándose en http://localhost:8000
# Simplemente abre tu navegador y ve a esa dirección
```

### Opción 2: Abrir Directamente
- Abre el archivo `index.html` directamente en tu navegador
- Todas las funcionalidades estarán disponibles

## 📁 Archivos del Proyecto

- `index.html` - Estructura principal del menú
- `styles.css` - Estilos y animaciones llamativas
- `script.js` - Funcionalidad de filtrado por categorías
- `server.js` - Servidor HTTP simple para desarrollo
- `README.md` - Este archivo de documentación

## 🎯 Características Técnicas

### Tecnologías Utilizadas
- **HTML5** con estructura semántica
- **CSS3** con animaciones avanzadas y Grid/Flexbox
- **JavaScript ES6+** con manejo moderno del DOM
- **Font Awesome** para iconos atractivos
- **Google Fonts (Poppins)** para tipografía moderna

### Animaciones Incluidas
- `slideDown` - Header al cargar
- `bounce` - Logo del camión y contacto
- `float` - Iconos del hero
- `rotate` - Iconos de productos
- `fadeInUp` - Items del menú

### Responsive Design
- **Desktop** (1200px+): Layout completo con grid
- **Tablet** (768px-1199px): Adaptación del grid
- **Mobile** (480px-767px): Layout de una columna
- **Small Mobile** (<480px): Optimización extrema

## 🎨 Personalización

### Colores Principales
```css
--primary-color: #ff6b35;    /* Naranja vibrante */
--secondary-color: #f7931e;  /* Amarillo anaranjado */
--accent-color: #ffcc00;     /* Amarillo brillante */
--success-color: #00b894;    /* Verde turquesa */
```

### Agregar Nuevos Productos
1. Agrega el HTML en la sección `.menu-items`
2. Incluye los atributos `data-category`, `data-name`, `data-price`
3. El JavaScript automáticamente manejará la funcionalidad

### Modificar Categorías
1. Actualiza los botones en `.menu-categories`
2. Asegúrate de que coincidan con los `data-category` de los productos

## 📱 Funcionalidades del Usuario

### Para el Cliente
1. **Explorar** el menú por categorías
2. **Ver información detallada** de cada producto
3. **Contactar** fácilmente para realizar pedidos
4. **Navegar** cómodamente por el menú interactivo

### Para el Vendedor
1. **Mostrar** los productos de forma atractiva
2. **Gestionar** el catálogo fácilmente
3. **Personalizar** precios y descripciones
4. **Facilitar** el contacto con los clientes

## 🔧 Desarrollo

### Servidor de Desarrollo
```bash
node server.js
```

### Estructura del Proyecto
```
menu-digital/
├── index.html      # Página principal
├── styles.css      # Estilos y animaciones
├── script.js       # Lógica de filtrado
├── server.js       # Servidor de desarrollo
└── README.md       # Documentación
```

## 🌟 Mejoras Futuras

- [ ] Integración con sistema de pagos
- [ ] Base de datos para productos
- [ ] Panel de administración
- [ ] Estadísticas de ventas
- [ ] Múltiples idiomas
- [ ] Modo oscuro
- [ ] Imágenes reales de productos
- [ ] Sistema de pedidos en tiempo real

## 📞 Soporte

¿Necesitas ayuda o tienes sugerencias? ¡El menú está diseñado para ser fácilmente personalizable y extensible!

---

## 📋 Menú Actual

### 🍔 Comida
- **Completos:**
  - Completo Italiano - $2.500
  - Completo Dinámico - $2.800
  - Completo Carne Mechada - $3.200
  - Completo Pollo Mechado - $3.000
  - Completo Pollo Queso - $3.200

- **Sándwiches:**
  - Sándwich Carne Mechada - $3.000
  - Sándwich de Pollo - $3.000

- **Chorrillanas:**
  - Chorrillana Tradicional - $8.500
  - Chorrillana Bistec a lo Pobre - $9.500
  - Chorrillana Marina - $10.500

- **Otros:**
  - Pichanga Familiar - $15.000
  - Salchipapas - $4.500

### 🥤 Bebidas
- Bebidas Express (Coca Cola, Sprite, Fanta) 350ml - $1.500
- Café (caliente o helado) - $1.200
- Milo (bebida achocolatada caliente) - $1.300
- Jugos naturales varios sabores - $1.800

**¡Haz que tu carro de comida rápida destaque con este menú digital vibrante y funcional!** 🚚✨
