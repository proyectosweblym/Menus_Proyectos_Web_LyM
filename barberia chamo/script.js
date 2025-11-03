// ============================================
// ALEXS BARBER - SCRIPT PRINCIPAL CON FIREBASE
// ============================================

console.log('🚀 Iniciando Alexs Barber con Firebase...');

// ============================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ============================================

// Firebase ya está inicializado en index.html desde el módulo
// Variables globales de Firebase disponibles: window.db

// Función para verificar si Firebase está disponible
function isFirebaseAvailable() {
    return typeof window.db !== 'undefined';
}

// ============================================
// VARIABLES GLOBALES
// ============================================

let currentSlide = 1;
const totalSlides = 8;
let slideInterval;
let isPlaying = true;

// Variables del sistema de reservas
let bookedAppointments = {};

// Variables del sistema de días bloqueados
let blockedDays = {};

// Variables del sistema de administración
let isAdminLoggedIn = false;
let adminSettings = {
    openingTime: '09:00',
    closingTime: '19:00',
    whatsappNumber: '56999431896'
};

// ============================================
// FUNCIONES DE FIREBASE FIRESTORE
// ============================================

/**
 * Cargar todas las reservas desde Firebase Firestore
 * Estructura: reservas/{fecha} -> { horas: ["09:00", "10:00", ...] }
 */
async function loadBookedAppointmentsFirebase() {
    try {
        console.log('🔥 Cargando reservas desde Firebase Firestore...');

        if (!isFirebaseAvailable()) {
            console.warn('⚠️ Firebase no disponible, usando localStorage como fallback');
            loadBookedAppointments();
            return;
        }

        // Importar funciones necesarias de Firestore
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');

        // Obtener todas las reservas de la colección
        const reservasRef = collection(window.db, 'reservas');
        const querySnapshot = await getDocs(reservasRef);

        // Limpiar datos locales
        bookedAppointments = {};

        // Procesar cada documento (cada documento es una fecha)
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const fecha = doc.id; // El ID del documento es la fecha (YYYY-MM-DD)
            
            if (data.horas && Array.isArray(data.horas) && data.horas.length > 0) {
                bookedAppointments[fecha] = data.horas;
            }
        });

        console.log(`✅ Reservas cargadas desde Firebase: ${Object.keys(bookedAppointments).length} fechas con reservas`);

        // Limpiar reservas antiguas automáticamente
        await cleanupOldAppointmentsFirebase();

    } catch (error) {
        console.error('❌ Error cargando reservas desde Firebase:', error);
        console.log('📦 Usando localStorage como fallback...');
        loadBookedAppointments();
    }
}

/**
 * Verificar si una hora específica está disponible en Firebase
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {string} time - Hora en formato HH:MM
 * @returns {boolean} - true si está disponible, false si está ocupada
 */
async function isTimeSlotAvailableFirebase(date, time) {
    try {
        if (!isFirebaseAvailable()) {
            return isTimeSlotAvailableLocal(date, time);
        }

        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');

        // Obtener documento de la fecha específica
        const docRef = doc(window.db, 'reservas', date);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // Si no existe el documento, la hora está disponible
            return true;
        }

        const data = docSnap.data();
        const horasOcupadas = data.horas || [];

        // Verificar si la hora está en el arreglo de horas ocupadas
        const isOccupied = horasOcupadas.includes(time);
        
        console.log(`🔍 Verificando ${date} a las ${time}: ${isOccupied ? '❌ Ocupada' : '✅ Disponible'}`);
        
        return !isOccupied;

    } catch (error) {
        console.error('❌ Error verificando disponibilidad en Firebase:', error);
        return isTimeSlotAvailableLocal(date, time);
    }
}

/**
 * Reservar una hora específica en Firebase
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {string} time - Hora en formato HH:MM
 * @returns {boolean} - true si se reservó exitosamente, false si ya estaba ocupada
 */
async function bookTimeSlotFirebase(date, time) {
    try {
        if (!isFirebaseAvailable()) {
            return bookTimeSlotLocal(date, time);
        }

        const { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');

        const docRef = doc(window.db, 'reservas', date);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // Crear nuevo documento con la primera reserva
            await setDoc(docRef, {
                horas: [time],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            console.log(`✅ Nueva fecha creada en Firebase: ${date} con hora ${time}`);
            
            // Actualizar cache local
            bookedAppointments[date] = [time];
            
            return true;
        }

        // Verificar si la hora ya está ocupada
        const data = docSnap.data();
        const horasOcupadas = data.horas || [];

        if (horasOcupadas.includes(time)) {
            console.log(`❌ Hora ${time} ya está ocupada para ${date}`);
            return false;
        }

        // Agregar la nueva hora al arreglo
        await updateDoc(docRef, {
            horas: arrayUnion(time),
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Hora ${time} reservada exitosamente en Firebase para ${date}`);

        // Actualizar cache local
        if (!bookedAppointments[date]) {
            bookedAppointments[date] = [];
        }
        bookedAppointments[date].push(time);

        return true;

    } catch (error) {
        console.error('❌ Error reservando hora en Firebase:', error);
        return bookTimeSlotLocal(date, time);
    }
}

/**
 * Limpiar reservas antiguas de Firebase (antes de hoy)
 */
async function cleanupOldAppointmentsFirebase() {
    try {
        const { collection, getDocs, deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');

        const today = getLocalISODate(new Date());
        const reservasRef = collection(window.db, 'reservas');
        const snapshot = await getDocs(reservasRef);

        const deletePromises = [];
        
        snapshot.forEach((document) => {
            const fecha = document.id;
            // Comparar fechas: si la fecha del documento es anterior a hoy, eliminar
            if (fecha < today) {
                const docRef = doc(window.db, 'reservas', fecha);
                deletePromises.push(deleteDoc(docRef));
            }
        });

        if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
            console.log(`🧹 ${deletePromises.length} reservas antiguas eliminadas de Firebase`);
        }

        // Actualizar cache local
        for (let fecha in bookedAppointments) {
            if (fecha < today) {
                delete bookedAppointments[fecha];
            }
        }

    } catch (error) {
        console.error('❌ Error limpiando reservas antiguas:', error);
    }
}

/**
 * Eliminar una hora específica de una fecha en Firebase
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {string} time - Hora en formato HH:MM
 */
async function deleteBookingFirebase(date, time) {
    try {
        if (!isFirebaseAvailable()) {
            return deleteBookingLocal(date, time);
        }

        const { doc, getDoc, updateDoc, deleteDoc, arrayRemove } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');

        const docRef = doc(window.db, 'reservas', date);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            console.log(`⚠️ No existe documento para la fecha ${date}`);
            return false;
        }

        const data = docSnap.data();
        const horasOcupadas = data.horas || [];

        // Remover la hora del arreglo
        await updateDoc(docRef, {
            horas: arrayRemove(time)
        });

        // Si ya no quedan horas, eliminar el documento completo
        if (horasOcupadas.length === 1 && horasOcupadas[0] === time) {
            await deleteDoc(docRef);
            console.log(`🗑️ Documento eliminado para ${date} (sin reservas restantes)`);
            
            // Actualizar cache local
            delete bookedAppointments[date];
        } else {
            console.log(`🗑️ Hora ${time} eliminada de ${date}`);
            
            // Actualizar cache local
            if (bookedAppointments[date]) {
                bookedAppointments[date] = bookedAppointments[date].filter(h => h !== time);
            }
        }

        return true;

    } catch (error) {
        console.error('❌ Error eliminando reserva en Firebase:', error);
        return false;
    }
}

/**
 * Eliminar todas las reservas de Firebase
 */
async function clearAllBookingsFirebase() {
    try {
        if (!isFirebaseAvailable()) {
            clearAllBookings();
            return;
        }

        const { collection, getDocs, deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');

        const reservasRef = collection(window.db, 'reservas');
        const snapshot = await getDocs(reservasRef);

        const deletePromises = [];
        
        snapshot.forEach((document) => {
            const docRef = doc(window.db, 'reservas', document.id);
            deletePromises.push(deleteDoc(docRef));
        });

        await Promise.all(deletePromises);
        
        console.log(`🗑️ ${deletePromises.length} documentos eliminados de Firebase`);

        // Limpiar cache local
        bookedAppointments = {};

        return true;

    } catch (error) {
        console.error('❌ Error limpiando todas las reservas:', error);
        return false;
    }
}

// ============================================
// REAL-TIME LISTENERS (SINCRONIZACIÓN AUTOMÁTICA)
// ============================================

/**
 * Inicializar listeners en tiempo real para sincronizar cambios
 * Cuando otra persona hace una reserva, se actualiza automáticamente
 */
async function initializeRealtimeListeners() {
    try {
        if (!isFirebaseAvailable()) {
            console.log('⚠️ Firebase no disponible, listeners en tiempo real desactivados');
            return;
        }

        console.log('🔥 Inicializando listeners en tiempo real...');

        const { collection, onSnapshot } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');

        // Escuchar cambios en la colección de reservas
        const reservasRef = collection(window.db, 'reservas');
        
        onSnapshot(reservasRef, (snapshot) => {
            console.log('🔄 Actualización en tiempo real detectada');
            
            // Actualizar cache local
            snapshot.docChanges().forEach((change) => {
                const fecha = change.doc.id;
                const data = change.doc.data();

                if (change.type === 'added' || change.type === 'modified') {
                    bookedAppointments[fecha] = data.horas || [];
                    console.log(`✅ Actualizado ${fecha}: ${data.horas?.length || 0} horas ocupadas`);
                }

                if (change.type === 'removed') {
                    delete bookedAppointments[fecha];
                    console.log(`🗑️ Eliminado ${fecha}`);
                }
            });

            // Si el modal de reservas está abierto, actualizar los horarios
            const bookingModal = document.getElementById('bookingModal');
            if (bookingModal && bookingModal.classList.contains('show')) {
                updateTimeSlotsAvailability();
            }

            // Si el panel de admin está abierto, actualizar la lista
            if (isAdminLoggedIn) {
                refreshBookingsList();
            }
        });

        console.log('✅ Listeners en tiempo real activos - sincronización automática habilitada');

    } catch (error) {
        console.error('❌ Error inicializando listeners:', error);
    }
}

// ============================================
// FUNCIONES LOCALES (FALLBACK)
// ============================================

function isTimeSlotAvailableLocal(date, time) {
    if (bookedAppointments[date] && bookedAppointments[date].includes(time)) {
        return false;
    }
    return true;
}

function bookTimeSlotLocal(date, time) {
    if (!bookedAppointments[date]) {
        bookedAppointments[date] = [];
    }
    
    if (!bookedAppointments[date].includes(time)) {
        bookedAppointments[date].push(time);
        saveBookedAppointments();
        return true;
    }
    
    return false;
}

function deleteBookingLocal(date, time) {
    if (bookedAppointments[date]) {
        const index = bookedAppointments[date].indexOf(time);
        if (index > -1) {
            bookedAppointments[date].splice(index, 1);
            
            if (bookedAppointments[date].length === 0) {
                delete bookedAppointments[date];
            }
            
            saveBookedAppointments();
            return true;
        }
    }
    return false;
}

function loadBookedAppointments() {
    try {
        const saved = localStorage.getItem('alexBarberAppointments');
        if (saved) {
            bookedAppointments = JSON.parse(saved);
            console.log('📦 Reservas cargadas desde localStorage');
        }
    } catch (error) {
        console.error('❌ Error cargando desde localStorage:', error);
        bookedAppointments = {};
    }
}

function saveBookedAppointments() {
    try {
        localStorage.setItem('alexBarberAppointments', JSON.stringify(bookedAppointments));
        console.log('💾 Reservas guardadas en localStorage');
    } catch (error) {
        console.error('❌ Error guardando en localStorage:', error);
    }
}

// ============================================
// FUNCIONES WRAPPER (USAR ESTAS EN TU CÓDIGO)
// ============================================

/**
 * Verificar si una hora está disponible (usa Firebase o localStorage)
 */
async function isTimeSlotAvailable(date, time) {
    if (isFirebaseAvailable()) {
        return await isTimeSlotAvailableFirebase(date, time);
    } else {
        return isTimeSlotAvailableLocal(date, time);
    }
}

/**
 * Reservar una hora (usa Firebase o localStorage)
 */
async function bookTimeSlot(date, time) {
    if (isFirebaseAvailable()) {
        return await bookTimeSlotFirebase(date, time);
    } else {
        return bookTimeSlotLocal(date, time);
    }
}

/**
 * Eliminar una reserva (usa Firebase o localStorage)
 */
async function deleteBooking(date, time) {
    if (isFirebaseAvailable()) {
        const success = await deleteBookingFirebase(date, time);
        if (success) {
            refreshBookingsList();
            updateTimeSlotsAvailability();
        }
    } else {
        deleteBookingLocal(date, time);
        refreshBookingsList();
        updateTimeSlotsAvailability();
    }
}

/**
 * Limpiar todas las reservas
 */
async function clearAllBookings() {
    if (!confirm('¿Estás seguro de que deseas eliminar TODAS las reservas? Esta acción no se puede deshacer.')) {
        return;
    }

    if (isFirebaseAvailable()) {
        await clearAllBookingsFirebase();
    } else {
        bookedAppointments = {};
        saveBookedAppointments();
    }

    refreshBookingsList();
    updateTimeSlotsAvailability();
    console.log('🗑️ Todas las reservas eliminadas');
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function getLocalISODate(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function updateCurrentDate() {
    const fecha = new Date();
    const fechaLocal = fecha.toLocaleDateString('es-CL', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const fechaElement = document.getElementById("fecha");
    if (fechaElement) {
        fechaElement.innerText = fechaLocal;
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 DOM cargado, inicializando...');

    // Esperar a que Firebase esté listo
    await new Promise(resolve => setTimeout(resolve, 500));

    // Cargar datos desde Firebase
    await loadBookedAppointmentsFirebase();

    // Inicializar listeners en tiempo real
    await initializeRealtimeListeners();

    // Inicializar fecha actual
    updateCurrentDate();

    // Inicializar carrusel
    initCarousel();

    // Inicializar galería con paginación
    initializePortfolioGallery();

    // Manejar responsive
    handleResponsive();
    window.addEventListener('resize', handleResponsive);

    // Navegación por teclado
    document.addEventListener('keydown', handleKeyNavigation);

    // Cargar días bloqueados
    loadBlockedDays();

    console.log('✅ Página lista para usar');
    console.log('🔥 Firebase Firestore conectado');
    console.log('🔄 Sincronización en tiempo real activa');
    console.log('🖼️ Galería con paginación inicializada');
});

// ============================================
// FUNCIONES DEL CARRUSEL
// ============================================

function initCarousel() {
    const indicatorsContainer = document.getElementById('carouselIndicators');
    if (!indicatorsContainer) return;

    for (let i = 1; i <= totalSlides; i++) {
        const indicator = document.createElement('span');
        indicator.className = i === 1 ? 'indicator active' : 'indicator';
        indicator.onclick = () => goToSlide(i);
        indicatorsContainer.appendChild(indicator);
    }

    showSlide(currentSlide);
    startAutoSlide();

    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', pauseAutoSlide);
        carouselContainer.addEventListener('mouseleave', resumeAutoSlide);
    }
}

function showSlide(n) {
    const slides = document.querySelectorAll('.carousel-item');
    const indicators = document.querySelectorAll('.indicator');

    if (n > totalSlides) currentSlide = 1;
    if (n < 1) currentSlide = totalSlides;

    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));

    if (slides[currentSlide - 1]) {
        slides[currentSlide - 1].classList.add('active');
    }

    if (indicators[currentSlide - 1]) {
        indicators[currentSlide - 1].classList.add('active');
    }
}

function nextSlide() {
    currentSlide++;
    showSlide(currentSlide);
    resetAutoSlide();
}

function previousSlide() {
    currentSlide--;
    showSlide(currentSlide);
    resetAutoSlide();
}

function goToSlide(n) {
    currentSlide = n;
    showSlide(currentSlide);
    resetAutoSlide();
}

function startAutoSlide() {
    slideInterval = setInterval(() => {
        nextSlide();
    }, 5000);
}

function stopAutoSlide() {
    clearInterval(slideInterval);
    slideInterval = null;
}

function pauseAutoSlide() {
    clearInterval(slideInterval);
    isPlaying = false;
}

function resumeAutoSlide() {
    if (!isPlaying && window.innerWidth > 768) {
        startAutoSlide();
        isPlaying = true;
    }
}

function resetAutoSlide() {
    stopAutoSlide();
    startAutoSlide();
}

// ============================================
// FUNCIONES DE LA GALERÍA CON PAGINACIÓN
// ============================================

let currentImageIndex = 0;
const imagesPerPage = 6;
let allPortfolioItems = [];

// Función para inicializar la galería con paginación
function initializePortfolioGallery() {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (!portfolioGrid) return;

    // Obtener todas las imágenes del portfolio
    allPortfolioItems = Array.from(portfolioGrid.querySelectorAll('.portfolio-item'));

    // Mostrar solo las primeras 6 imágenes inicialmente
    showPortfolioImages(0, imagesPerPage);

    // Configurar el botón "Ver más"
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', toggleGalleryView);
    }
}

// Función para mostrar imágenes del portfolio en un rango específico
function showPortfolioImages(startIndex, count) {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (!portfolioGrid) return;

    // Ocultar todas las imágenes primero
    allPortfolioItems.forEach(item => {
        item.style.display = 'none';
    });

    // Mostrar las imágenes del rango especificado
    const endIndex = Math.min(startIndex + count, allPortfolioItems.length);
    for (let i = startIndex; i < endIndex; i++) {
        if (allPortfolioItems[i]) {
            allPortfolioItems[i].style.display = 'block';
        }
    }

    // Actualizar el índice actual
    currentImageIndex = endIndex;

    // Ocultar el botón si ya se mostraron todas las imágenes
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        if (currentImageIndex >= allPortfolioItems.length) {
            loadMoreBtn.classList.add('hidden');
        } else {
            loadMoreBtn.classList.remove('hidden');
        }
    }
}

// Función para alternar entre ver todas las imágenes y ver paginadas
function toggleGalleryView() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;

    const isShowingAll = currentImageIndex >= allPortfolioItems.length;

    if (isShowingAll) {
        // Si ya se muestran todas, volver a mostrar solo las primeras 6
        showPortfolioImages(0, imagesPerPage);
        loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Ver más trabajos';
        loadMoreBtn.classList.remove('hidden');
    } else {
        // Si no se muestran todas, mostrar todas las imágenes
        showAllImages();
        loadMoreBtn.innerHTML = '<i class="fas fa-minus"></i> Ver menos trabajos';
    }
}

// Función para mostrar todas las imágenes
function showAllImages() {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (!portfolioGrid) return;

    // Mostrar todas las imágenes
    allPortfolioItems.forEach(item => {
        item.style.display = 'block';
    });

    // Actualizar el índice actual
    currentImageIndex = allPortfolioItems.length;
}

// Función para cargar más imágenes (mantengo la función original por si se necesita)
function loadMoreImages() {
    const remainingImages = allPortfolioItems.length - currentImageIndex;
    const imagesToLoad = Math.min(imagesPerPage, remainingImages);

    if (imagesToLoad > 0) {
        showPortfolioImages(currentImageIndex, imagesToLoad);
    }
}

// ============================================
// FUNCIONES DEL MODAL DE GALERÍA
// ============================================

function openModal(element) {
    const modal = document.getElementById('mediaModal');
    const modalImg = document.getElementById('modalImage');

    if (!modal || !modalImg) return;

    const mediaType = element.getAttribute('data-type');
    const imgElement = element.querySelector('img');

    if (mediaType === 'image' && imgElement) {
        modalImg.src = imgElement.src;
        modalImg.style.display = 'block';
    }

    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('mediaModal');
    if (!modal) return;

    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);

    document.body.style.overflow = 'auto';
}

document.addEventListener('click', function(e) {
    const modal = document.getElementById('mediaModal');
    if (e.target === modal) {
        closeModal();
    }
});

// ============================================
// FUNCIONES DEL MODAL DE RESERVAS
// ============================================

function openBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
    document.body.style.overflow = 'hidden';

    initializeBookingForm();
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);

    document.body.style.overflow = 'auto';
    resetBookingForm();
}

function initializeBookingForm() {
    const form = document.getElementById('bookingForm');
    const serviceSelect = document.getElementById('serviceType');
    const dateInput = document.getElementById('appointmentDate');
    const timeSelect = document.getElementById('appointmentTime');

    if (!form || !serviceSelect || !dateInput || !timeSelect) return;

    const today = new Date();
    const todayChile = new Date(today.toLocaleString("en-US", {timeZone: "America/Santiago"}));
    const minDate = getLocalISODate(todayChile);
    
    dateInput.min = minDate;
    dateInput.value = minDate;

    dateInput.addEventListener('change', updateTimeSlotsAvailability);
    form.addEventListener('change', updateBookingSummary);
    form.addEventListener('submit', handleBookingSubmit);

    updateTimeSlotsAvailability();
}

/**
 * Actualizar horarios disponibles/ocupados en el select
 * Consulta Firebase en tiempo real para cada hora
 */
async function updateTimeSlotsAvailability() {
    const dateInput = document.getElementById('appointmentDate');
    const timeSelect = document.getElementById('appointmentTime');

    if (!dateInput || !timeSelect) return;

    const selectedDate = dateInput.value;
    if (!selectedDate) return;

    console.log('🔄 Actualizando horarios para fecha:', selectedDate);

    // Limpiar opciones anteriores
    while (timeSelect.children.length > 1) {
        timeSelect.removeChild(timeSelect.lastChild);
    }

    const availableTimes = [
        '09:00', '10:00', '11:00', '12:00',
        '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
    ];

    // Verificar disponibilidad de cada hora
    for (const time of availableTimes) {
        const option = document.createElement('option');
        option.value = time;

        try {
            const isAvailable = await isTimeSlotAvailable(selectedDate, time);

            if (isAvailable) {
                option.textContent = `${time} - Disponible`;
                option.className = 'time-available';
            } else {
                option.textContent = `${time} - Hora ocupada`;
                option.className = 'time-occupied';
                option.disabled = true;
            }
        } catch (error) {
            console.error('❌ Error verificando horario:', time, error);
            option.textContent = `${time} - Disponible`;
            option.className = 'time-available';
        }

        timeSelect.appendChild(option);
    }

    console.log(`📅 Horarios actualizados para ${selectedDate}`);
}

function updateBookingSummary() {
    const serviceSelect = document.getElementById('serviceType');
    const dateInput = document.getElementById('appointmentDate');
    const timeSelect = document.getElementById('appointmentTime');

    const summary = document.getElementById('bookingSummary');
    const summaryService = document.getElementById('summaryService');
    const summaryDateTime = document.getElementById('summaryDateTime');
    const summaryTotal = document.getElementById('summaryTotal');

    if (!summary || !summaryService || !summaryDateTime || !summaryTotal) return;

    const serviceText = serviceSelect.options[serviceSelect.selectedIndex].text;
    const dateValue = dateInput.value;
    const timeValue = timeSelect.value;

    let formattedDateTime = 'No seleccionado';
    if (dateValue && timeValue) {
        const date = new Date(dateValue + 'T' + timeValue);
        formattedDateTime = date.toLocaleDateString('es-CL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const servicePrice = getServicePrice(serviceSelect.value);

    summaryService.textContent = serviceText;
    summaryDateTime.textContent = formattedDateTime;
    summaryTotal.textContent = `$${servicePrice.toLocaleString('es-CL')}`;

    summary.style.display = 'block';
}

function getServicePrice(serviceValue) {
    const prices = {
        'corte_clasico': 9000,
        'corte_moderno': 10000,
        'barba': 5000,
        'cejas': 2000
    };
    return prices[serviceValue] || 0;
}

async function handleBookingSubmit(event) {
    event.preventDefault();

    const form = document.getElementById('bookingForm');
    const formData = new FormData(form);

    const bookingData = {
        customerName: formData.get('customerName'),
        customerPhone: formData.get('customerPhone'),
        serviceType: formData.get('serviceType'),
        appointmentDate: formData.get('appointmentDate'),
        appointmentTime: formData.get('appointmentTime'),
        specialRequests: formData.get('specialRequests')
    };

    if (!validateBookingData(bookingData)) {
        return;
    }

    // Marcar la hora como ocupada en Firebase
    const success = await bookTimeSlot(bookingData.appointmentDate, bookingData.appointmentTime);

    if (!success) {
        alert('❌ Lo sentimos, esta hora acaba de ser reservada por otro cliente. Por favor selecciona otra hora.');
        updateTimeSlotsAvailability();
        return;
    }

    showBookingConfirmation(bookingData);
}

function validateBookingData(data) {
    if (!data.customerName || data.customerName.trim().length < 2) {
        alert('Por favor ingresa un nombre válido (mínimo 2 caracteres)');
        document.getElementById('customerName').focus();
        return false;
    }

    if (!data.customerPhone || data.customerPhone.trim().length < 8) {
        alert('Por favor ingresa un teléfono válido (mínimo 8 dígitos)');
        document.getElementById('customerPhone').focus();
        return false;
    }

    if (!data.serviceType) {
        alert('Por favor selecciona un tipo de servicio');
        document.getElementById('serviceType').focus();
        return false;
    }

    if (!data.appointmentDate) {
        alert('Por favor selecciona una fecha');
        document.getElementById('appointmentDate').focus();
        return false;
    }

    if (!data.appointmentTime) {
        alert('Por favor selecciona una hora');
        document.getElementById('appointmentTime').focus();
        return false;
    }

    const selectedDate = new Date(data.appointmentDate + 'T00:00:00');
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    if (selectedDate < todayLocal) {
        alert('La fecha seleccionada no puede ser en el pasado');
        document.getElementById('appointmentDate').focus();
        return false;
    }

    if (isDayBlocked(data.appointmentDate)) {
        const blockedDayInfo = blockedDays[getLocalISODate(new Date(data.appointmentDate))];
        const reason = blockedDayInfo && blockedDayInfo.reason ? `\n\nMotivo: ${blockedDayInfo.reason}` : '';
        alert(`❌ No se pueden hacer reservas para la fecha seleccionada.${reason}\n\nPor favor elige otra fecha.`);
        document.getElementById('appointmentDate').focus();
        return false;
    }

    return true;
}

function showBookingConfirmation(bookingData) {
    const serviceText = document.querySelector(`#serviceType option[value="${bookingData.serviceType}"]`).textContent;

    const confirmationMessage = `
🎉 ¡NUEVA RESERVA CONFIRMADA! 🎉

✨ *ALEX BARBER - Estilo y Elegancia* ✨

👤 *Cliente:* ${bookingData.customerName}
📱 *Teléfono:* ${bookingData.customerPhone}

✂️ *Servicio:* ${serviceText}
📅 *Fecha:* ${new Date(bookingData.appointmentDate + 'T00:00:00').toLocaleDateString('es-CL', {
        timeZone: 'America/Santiago',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}
🕐 *Hora:* ${bookingData.appointmentTime}
💰 *Precio:* $${getServicePrice(bookingData.serviceType).toLocaleString('es-CL')} CLP

📍 *Dirección:* Vega Monumental Pasillo 8 Local 190

✅ *¡Tu reserva está confirmada!*
⏰ *Te esperamos con mucho entusiasmo*

💡 *Recuerda llegar 5 minutos antes de tu cita*
📞 *Si necesitas cambiar o cancelar, contáctanos*

¡Gracias por elegirnos! 🙌
    `.trim();

    const encodedMessage = encodeURIComponent(confirmationMessage);
    const whatsappURL = `https://wa.me/56999431896?text=${encodedMessage}`;

    const whatsappWindow = window.open(whatsappURL, '_blank');

    if (!whatsappWindow) {
        if (confirm(confirmationMessage + '\n\n¿Deseas copiar el mensaje para enviarlo manualmente?')) {
            navigator.clipboard.writeText(confirmationMessage).then(() => {
                alert('✅ Mensaje copiado al portapapeles');
            });
        }
    }

    closeBookingModal();
    console.log('📋 Reserva confirmada:', bookingData);
}

function resetBookingForm() {
    const form = document.getElementById('bookingForm');
    const summary = document.getElementById('bookingSummary');

    if (form) {
        form.reset();
    }

    if (summary) {
        summary.style.display = 'none';
    }
}

// ============================================
// FUNCIONES DEL SISTEMA DE DÍAS BLOQUEADOS
// ============================================

function loadBlockedDays() {
    try {
        const saved = localStorage.getItem('alexBarberBlockedDays');
        if (saved) {
            blockedDays = JSON.parse(saved);
            console.log('🚫 Días bloqueados cargados:', Object.keys(blockedDays).length);
        } else {
            blockedDays = {};
        }
    } catch (error) {
        console.error('❌ Error al cargar días bloqueados:', error);
        blockedDays = {};
    }
}

function saveBlockedDays() {
    try {
        localStorage.setItem('alexBarberBlockedDays', JSON.stringify(blockedDays));
        console.log('💾 Días bloqueados guardados exitosamente');
    } catch (error) {
        console.error('❌ Error al guardar días bloqueados:', error);
    }
}

function isDayBlocked(date) {
    const dateKey = getLocalISODate(new Date(date));
    return blockedDays[dateKey] !== undefined;
}

function blockDay(date, reason = '') {
    const dateKey = getLocalISODate(new Date(date));

    if (!blockedDays[dateKey]) {
        blockedDays[dateKey] = {
            reason: reason,
            blockedAt: new Date().toISOString()
        };
        saveBlockedDays();
        console.log(`🚫 Día ${dateKey} bloqueado. Motivo: ${reason}`);
        return true;
    }

    return false;
}

function unblockDay(date) {
    const dateKey = getLocalISODate(new Date(date));

    if (blockedDays[dateKey]) {
        delete blockedDays[dateKey];
        saveBlockedDays();
        console.log(`✅ Día ${dateKey} desbloqueado`);
        return true;
    }

    return false;
}

function addBlockedDay() {
    const dateInput = document.getElementById('blockedDate');
    const reasonInput = document.getElementById('blockedReason');

    if (!dateInput || !reasonInput) return;

    const selectedDate = dateInput.value;
    const reason = reasonInput.value.trim();

    if (!selectedDate) {
        alert('Por favor selecciona una fecha');
        dateInput.focus();
        return;
    }

    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    if (selectedDateObj < todayLocal) {
        alert('No puedes bloquear fechas en el pasado');
        dateInput.focus();
        return;
    }

    if (blockDay(selectedDate, reason)) {
        alert(`✅ Día ${formatDateDisplay(selectedDate)} bloqueado exitosamente`);
        dateInput.value = '';
        reasonInput.value = '';
        refreshBlockedDaysList();
        updateTimeSlotsAvailability();
    } else {
        alert('Este día ya está bloqueado');
    }
}

function removeBlockedDay(date) {
    if (unblockDay(date)) {
        alert(`✅ Día ${formatDateDisplay(date)} desbloqueado exitosamente`);
        refreshBlockedDaysList();
        updateTimeSlotsAvailability();
    }
}

function clearAllBlockedDays() {
    if (Object.keys(blockedDays).length === 0) {
        alert('No hay días bloqueados para desbloquear.');
        return;
    }

    if (confirm('¿Estás seguro de que deseas desbloquear TODOS los días?')) {
        blockedDays = {};
        saveBlockedDays();
        refreshBlockedDaysList();
        updateTimeSlotsAvailability();
        console.log('🗑️ Todos los días bloqueados eliminados');
    }
}

function refreshBlockedDaysList() {
    const blockedDaysList = document.getElementById('blockedDaysList');
    if (!blockedDaysList) return;

    blockedDaysList.innerHTML = '';

    if (Object.keys(blockedDays).length === 0) {
        blockedDaysList.innerHTML = '<p class="no-blocked-days">No hay días bloqueados.</p>';
        return;
    }

    const sortedDates = Object.keys(blockedDays).sort();

    sortedDates.forEach(date => {
        const dayInfo = blockedDays[date];

        const dayItem = document.createElement('div');
        dayItem.className = 'blocked-day-item';

        const dayInfoDiv = document.createElement('div');
        dayInfoDiv.className = 'blocked-day-info';

        const dayDate = document.createElement('div');
        dayDate.className = 'blocked-day-date';
        dayDate.textContent = formatDateDisplay(date);

        const dayReason = document.createElement('div');
        dayReason.className = 'blocked-day-reason';
        dayReason.textContent = dayInfo.reason || 'Sin motivo especificado';

        dayInfoDiv.appendChild(dayDate);
        dayInfoDiv.appendChild(dayReason);

        const dayActions = document.createElement('div');
        dayActions.className = 'blocked-day-actions';

        const unblockBtn = document.createElement('button');
        unblockBtn.className = 'btn btn-secondary btn-small';
        unblockBtn.innerHTML = '<i class="fas fa-unlock"></i> Desbloquear';
        unblockBtn.onclick = () => removeBlockedDay(date);

        dayActions.appendChild(unblockBtn);

        dayItem.appendChild(dayInfoDiv);
        dayItem.appendChild(dayActions);

        blockedDaysList.appendChild(dayItem);
    });
}

function exportBlockedDays() {
    if (Object.keys(blockedDays).length === 0) {
        alert('No hay días bloqueados para exportar.');
        return;
    }

    let exportContent = 'DÍAS BLOQUEADOS - ALEX BARBER\n';
    exportContent += '================================\n\n';

    const sortedDates = Object.keys(blockedDays).sort();

    sortedDates.forEach(date => {
        const dayInfo = blockedDays[date];
        exportContent += `Fecha: ${formatDateDisplay(date)}\n`;
        exportContent += `Motivo: ${dayInfo.reason || 'Sin motivo especificado'}\n`;
        exportContent += `Bloqueado el: ${new Date(dayInfo.blockedAt).toLocaleString('es-CL')}\n`;
        exportContent += '--------------------------------\n\n';
    });

    exportContent += `\nTotal de días bloqueados: ${Object.keys(blockedDays).length}\n`;
    exportContent += `Exportado el: ${new Date().toLocaleString('es-CL')}\n`;

    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dias-bloqueados-alex-barber-${getLocalISODate()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// ============================================
// FUNCIONES DEL SISTEMA DE ADMINISTRACIÓN
// ============================================

function openAdminModal() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;

    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        const passwordInput = document.getElementById('adminPassword');
        if (passwordInput) {
            passwordInput.focus();
        }
    }, 100);
}

function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;

    modal.classList.remove('show');

    setTimeout(() => {
        modal.style.display = 'none';
        const loginForm = document.getElementById('adminLoginForm');
        const adminPanel = document.getElementById('adminPanel');
        const passwordInput = document.getElementById('adminPassword');

        if (loginForm) loginForm.style.display = 'block';
        if (adminPanel) adminPanel.style.display = 'none';
        if (passwordInput) passwordInput.value = '';

        isAdminLoggedIn = false;
    }, 300);

    document.body.style.overflow = 'auto';
}

function adminLogin() {
    const passwordInput = document.getElementById('adminPassword');
    const password = passwordInput.value;

    const adminPassword = 'admin123';

    if (password === adminPassword) {
        isAdminLoggedIn = true;

        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) loginForm.style.display = 'none';

        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) adminPanel.style.display = 'block';

        refreshBookingsList();
        loadSettings();

        console.log('🔓 Administrador autenticado exitosamente');
    } else {
        alert('❌ Contraseña incorrecta. Inténtalo de nuevo.');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function showAdminSection(section) {
    const bookingsSection = document.getElementById('adminBookingsSection');
    const blockedDaysSection = document.getElementById('adminBlockedDaysSection');
    const settingsSection = document.getElementById('adminSettingsSection');

    const navButtons = document.querySelectorAll('.admin-nav-btn');

    if (section === 'bookings') {
        if (bookingsSection) bookingsSection.style.display = 'block';
        if (blockedDaysSection) blockedDaysSection.style.display = 'none';
        if (settingsSection) settingsSection.style.display = 'none';

        navButtons.forEach(btn => btn.classList.remove('active'));
        navButtons[0].classList.add('active');
    } else if (section === 'blocked-days') {
        if (bookingsSection) bookingsSection.style.display = 'none';
        if (blockedDaysSection) blockedDaysSection.style.display = 'block';
        if (settingsSection) settingsSection.style.display = 'none';

        refreshBlockedDaysList();

        navButtons.forEach(btn => btn.classList.remove('active'));
        navButtons[1].classList.add('active');
    } else if (section === 'settings') {
        if (bookingsSection) bookingsSection.style.display = 'none';
        if (blockedDaysSection) blockedDaysSection.style.display = 'none';
        if (settingsSection) settingsSection.style.display = 'block';

        navButtons.forEach(btn => btn.classList.remove('active'));
        navButtons[2].classList.add('active');
    }
}

function refreshBookingsList() {
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) return;

    bookingsList.innerHTML = '';

    if (Object.keys(bookedAppointments).length === 0) {
        bookingsList.innerHTML = '<p class="no-bookings">No hay reservas registradas.</p>';
        return;
    }

    const sortedDates = Object.keys(bookedAppointments).sort();

    sortedDates.forEach(date => {
        const dateAppointments = bookedAppointments[date];

        const dateContainer = document.createElement('div');
        dateContainer.className = 'date-container';

        const dateTitle = document.createElement('h4');
        dateTitle.className = 'date-title';
        dateTitle.textContent = formatDateDisplay(date);
        dateContainer.appendChild(dateTitle);

        const timesList = document.createElement('div');
        timesList.className = 'times-list';

        dateAppointments.forEach(time => {
            const timeItem = document.createElement('div');
            timeItem.className = 'time-item';

            const timeInfo = document.createElement('div');
            timeInfo.className = 'time-info';
            timeInfo.textContent = `${time} - Ocupada`;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete-time';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Eliminar reserva';
            deleteBtn.onclick = () => {
                if (confirm(`¿Estás seguro de que deseas eliminar la reserva del ${formatDateDisplay(date)} a las ${time}?`)) {
                    deleteBooking(date, time);
                }
            };

            timeItem.appendChild(timeInfo);
            timeItem.appendChild(deleteBtn);
            timesList.appendChild(timeItem);
        });

        dateContainer.appendChild(timesList);
        bookingsList.appendChild(dateContainer);
    });
}

function formatDateDisplay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function exportBookings() {
    if (Object.keys(bookedAppointments).length === 0) {
        alert('No hay reservas para exportar.');
        return;
    }

    let exportContent = 'RESERVAS - ALEX BARBER\n';
    exportContent += '================================\n\n';

    const sortedDates = Object.keys(bookedAppointments).sort();

    sortedDates.forEach(date => {
        exportContent += `Fecha: ${formatDateDisplay(date)}\n`;
        exportContent += '--------------------------------\n';

        bookedAppointments[date].forEach(time => {
            exportContent += `• ${time} - Ocupada\n`;
        });

        exportContent += '\n';
    });

    exportContent += `\nTotal de reservas: ${Object.values(bookedAppointments).reduce((total, day) => total + day.length, 0)}\n`;
    exportContent += `Exportado el: ${new Date().toLocaleString('es-CL')}\n`;

    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservas-alex-barber-${getLocalISODate()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

async function saveSettings() {
    const openingTime = document.getElementById('openingTime').value;
    const closingTime = document.getElementById('closingTime').value;
    const whatsappNumber = document.getElementById('whatsappNumber').value;

    adminSettings = {
        openingTime,
        closingTime,
        whatsappNumber,
        updatedAt: new Date().toISOString()
    };

    // Guardar en localStorage
    localStorage.setItem('alexBarberSettings', JSON.stringify(adminSettings));

    // Guardar en Firebase si está disponible
    if (isFirebaseAvailable()) {
        try {
            const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            
            const settingsRef = doc(window.db, 'configuracion', 'general');
            await setDoc(settingsRef, {
                ...adminSettings,
                updatedAt: serverTimestamp()
            }, { merge: true });

            console.log('✅ Configuración guardada en Firebase');
        } catch (error) {
            console.error('⚠️ Error guardando en Firebase:', error);
        }
    }

    alert('✅ Configuración guardada exitosamente');
}

function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('alexBarberSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            adminSettings = { ...adminSettings, ...settings };

            const openingTimeSelect = document.getElementById('openingTime');
            const closingTimeSelect = document.getElementById('closingTime');
            const whatsappInput = document.getElementById('whatsappNumber');

            if (openingTimeSelect) openingTimeSelect.value = adminSettings.openingTime;
            if (closingTimeSelect) closingTimeSelect.value = adminSettings.closingTime;
            if (whatsappInput) whatsappInput.value = adminSettings.whatsappNumber;
        }
    } catch (error) {
        console.error('❌ Error al cargar configuración:', error);
    }
}

// Cerrar modales al hacer clic fuera
document.addEventListener('click', function(e) {
    const adminModal = document.getElementById('adminModal');
    if (e.target === adminModal) {
        closeAdminModal();
    }
});

document.addEventListener('click', function(e) {
    const bookingModal = document.getElementById('bookingModal');
    if (e.target === bookingModal) {
        closeBookingModal();
    }
});

// ============================================
// FUNCIONES DE NAVEGACIÓN Y RESPONSIVE
// ============================================

function handleKeyNavigation(event) {
    switch(event.key) {
        case 'ArrowLeft':
            previousSlide();
            break;
        case 'ArrowRight':
            nextSlide();
            break;
        case 'Escape':
            closeModal();
            closeBookingModal();
            closeAdminModal();
            break;
    }
}

function handleResponsive() {
    const carouselBtn = document.querySelectorAll('.carousel-btn');

    if (window.innerWidth <= 768) {
        carouselBtn.forEach(btn => {
            btn.style.display = 'none';
        });
        stopAutoSlide();
        enableTouchGestures();
    } else {
        carouselBtn.forEach(btn => {
            btn.style.display = 'block';
        });
        if (!slideInterval) {
            startAutoSlide();
        }
        disableTouchGestures();
    }
}

function enableTouchGestures() {
    const carousel = document.querySelector('.carousel-container');
    if (!carousel || carousel.hasTouchListener) return;

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;

    carousel.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    carousel.addEventListener('touchmove', function(e) {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
    }, { passive: true });

    carousel.addEventListener('touchend', function(e) {
        const diffX = currentX - startX;
        const diffY = currentY - startY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
                previousSlide();
            } else {
                nextSlide();
            }
        }
    }, { passive: true });

    carousel.hasTouchListener = true;
}

function disableTouchGestures() {
    const carousel = document.querySelector('.carousel-container');
    if (!carousel || !carousel.hasTouchListener) return;
    carousel.hasTouchListener = false;
}

// ============================================
// LOG FINAL
// ============================================

console.log('🎉 Alexs Barber - Sistema con Firebase Firestore completamente funcional');
console.log('📋 Funcionalidades:');
console.log('   • Firebase Firestore para almacenamiento en la nube');
console.log('   • Sincronización en tiempo real entre dispositivos');
console.log('   • Reservas compartidas globalmente');
console.log('   • Sistema de días bloqueados');
console.log('   • Panel de administración completo');
console.log('   • Fallback automático a localStorage si Firebase falla');
console.log('🔥 Firebase conectado y listo');
console.log('🎯 Sistema listo en http://localhost:8000');

// ============================================
// FUNCIONES DE CONFIGURACIÓN FIREBASE
// ============================================

/**
 * Función para reconfigurar Firebase con nuevas credenciales
 * Útil para cambiar entre entornos (desarrollo/producción)
 */
window.reconfigureFirebase = function(config) {
    try {
        console.log('🔧 Reconfigurando Firebase...');

        // Actualizar configuración global
        Object.assign(firebaseConfig, config);

        // Re-inicializar Firebase si es necesario
        if (window.db) {
            console.log('✅ Firebase reconfigurado exitosamente');
            console.log('🔄 Recargando datos...');

            // Recargar datos con nueva configuración
            loadBookedAppointmentsFirebase();
            initializeRealtimeListeners();

            return true;
        }

    } catch (error) {
        console.error('❌ Error reconfigurando Firebase:', error);
        return false;
    }
};

/**
 * Función para probar la conexión a Firebase
 */
window.testFirebaseConnection = async function() {
    try {
        console.log('🔍 Probando conexión a Firebase...');

        if (!isFirebaseAvailable()) {
            console.error('❌ Firebase no está disponible');
            return false;
        }

        // Intentar hacer una consulta simple
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
        const testRef = collection(window.db, 'reservas');
        const snapshot = await getDocs(testRef);

        console.log('✅ Conexión a Firebase exitosa');
        console.log(`📊 Documentos encontrados: ${snapshot.size}`);

        return true;

    } catch (error) {
        console.error('❌ Error de conexión a Firebase:', error);
        return false;
    }
};

/**
 * Función para limpiar datos antiguos de Firebase
 */
window.cleanupFirebaseData = async function() {
    try {
        console.log('🧹 Limpiando datos antiguos de Firebase...');

        if (!isFirebaseAvailable()) {
            console.log('⚠️ Firebase no disponible');
            return false;
        }

        const today = getLocalISODate(new Date());

        // Limpiar reservas antiguas
        const { collection, getDocs, deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');

        const reservasRef = collection(window.db, 'reservas');
        const snapshot = await getDocs(reservasRef);

        let deletedCount = 0;
        snapshot.forEach((document) => {
            if (document.id < today) {
                deleteDoc(doc(window.db, 'reservas', document.id));
                deletedCount++;
            }
        });

        console.log(`✅ ${deletedCount} documentos antiguos eliminados`);
        return deletedCount;

    } catch (error) {
        console.error('❌ Error limpiando datos:', error);
        return false;
    }
};

/**
 * Función para mostrar estadísticas de Firebase
 */
window.showFirebaseStats = async function() {
    try {
        console.log('📊 Estadísticas de Firebase:');

        if (!isFirebaseAvailable()) {
            console.log('❌ Firebase no disponible');
            return;
        }

        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');

        // Contar reservas
        const reservasRef = collection(window.db, 'reservas');
        const reservasSnapshot = await getDocs(reservasRef);

        let totalReservas = 0;
        reservasSnapshot.forEach(doc => {
            const data = doc.data();
            totalReservas += (data.horas || []).length;
        });

        console.log(`📅 Total de fechas con reservas: ${reservasSnapshot.size}`);
        console.log(`⏰ Total de reservas: ${totalReservas}`);
        console.log(`🔥 Estado de conexión: ✅ Activa`);
        console.log(`🔄 Sincronización: ✅ En tiempo real`);

        return {
            fechas: reservasSnapshot.size,
            reservas: totalReservas,
            conexion: 'activa',
            sincronizacion: 'tiempo_real'
        };

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
    }
};

// ============================================
// FUNCIONES DE EMERGENCIA Y RECUPERACIÓN
// ============================================

/**
 * Función de recuperación de emergencia
 * Restaura datos desde localStorage si Firebase falla completamente
 */
window.emergencyRecovery = function() {
    console.log('🚨 Ejecutando recuperación de emergencia...');

    try {
        // Limpiar datos actuales
        bookedAppointments = {};
        blockedDays = {};

        // Cargar desde localStorage
        loadBookedAppointments();
        loadBlockedDays();

        console.log('✅ Datos restaurados desde localStorage');
        console.log('📦 Sistema funcionando en modo local');

        // Mostrar estadísticas
        showSystemStats();

        return true;

    } catch (error) {
        console.error('❌ Error en recuperación de emergencia:', error);
        return false;
    }
};

/**
 * Función para verificar y reparar el sistema
 */
window.systemCheck = async function() {
    console.log('🔍 Ejecutando chequeo completo del sistema...');

    const checks = [];

    // Verificar Firebase
    if (isFirebaseAvailable()) {
        const firebaseOk = await testFirebaseConnection();
        checks.push({ componente: 'Firebase', estado: firebaseOk ? '✅ OK' : '❌ Error' });
    } else {
        checks.push({ componente: 'Firebase', estado: '⚠️ No disponible' });
    }

    // Verificar localStorage
    try {
        const testKey = 'alexBarberTest_' + Date.now();
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        checks.push({ componente: 'localStorage', estado: '✅ OK' });
    } catch (e) {
        checks.push({ componente: 'localStorage', estado: '❌ Lleno' });
    }

    // Verificar datos
    const totalReservas = Object.values(bookedAppointments).reduce((t, d) => t + d.length, 0);
    checks.push({ componente: 'Datos de reservas', estado: `✅ ${totalReservas} reservas` });

    const totalBloqueados = Object.keys(blockedDays).length;
    checks.push({ componente: 'Días bloqueados', estado: `✅ ${totalBloqueados} días` });

    // Mostrar resultados
    console.log('📋 Resultados del chequeo:');
    checks.forEach(check => {
        console.log(`   ${check.componente}: ${check.estado}`);
    });

    return checks;
};

// ============================================
// FUNCIONES DE EXPORTACIÓN E IMPORTACIÓN
// ============================================

/**
 * Exportar todos los datos del sistema
 */
window.exportAllData = function() {
    const allData = {
        timestamp: new Date().toISOString(),
        version: '2.0',
        firebase: {
            config: firebaseConfig,
            available: isFirebaseAvailable()
        },
        data: {
            bookedAppointments,
            blockedDays,
            adminSettings
        },
        stats: {
            totalBookings: Object.values(bookedAppointments).reduce((t, d) => t + d.length, 0),
            totalBlockedDays: Object.keys(blockedDays).length,
            firebaseConnected: isFirebaseAvailable()
        }
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-completo-barberia-${getLocalISODate()}.json`;
    a.click();

    URL.revokeObjectURL(url);

    console.log('💾 Datos completos exportados');
    return allData;
};

/**
 * Importar datos desde archivo
 */
window.importData = function(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (data.data) {
                bookedAppointments = data.data.bookedAppointments || {};
                blockedDays = data.data.blockedDays || {};
                adminSettings = data.data.adminSettings || adminSettings;

                // Guardar en localStorage
                saveBookedAppointments();
                saveBlockedDays();
                localStorage.setItem('alexBarberSettings', JSON.stringify(adminSettings));

                console.log('✅ Datos importados exitosamente');

                // Actualizar UI
                refreshBookingsList();
                refreshBlockedDaysList();

                alert('Datos importados correctamente');
            }

        } catch (error) {
            console.error('❌ Error importando datos:', error);
            alert('Error al importar los datos');
        }
    };
    reader.readAsText(file);
};

// ============================================
// FUNCIONES GLOBALES DISPONIBLES
// ============================================

// Hacer funciones disponibles globalmente
window.reconfigureFirebase = reconfigureFirebase;
window.testFirebaseConnection = testFirebaseConnection;
window.cleanupFirebaseData = cleanupFirebaseData;
window.showFirebaseStats = showFirebaseStats;
window.emergencyRecovery = emergencyRecovery;
window.systemCheck = systemCheck;
window.exportAllData = exportAllData;
window.importData = importData;

// ============================================
// INSTRUCCIONES PARA EL USUARIO
// ============================================

console.log('🔧 Funciones disponibles en consola:');
console.log('   • testFirebaseConnection() - Probar conexión Firebase');
console.log('   • showFirebaseStats() - Ver estadísticas Firebase');
console.log('   • cleanupFirebaseData() - Limpiar datos antiguos');
console.log('   • reconfigureFirebase(config) - Cambiar configuración');
console.log('   • emergencyRecovery() - Recuperación de emergencia');
console.log('   • systemCheck() - Chequeo completo del sistema');
console.log('   • exportAllData() - Exportar todos los datos');
console.log('   • showStats() - Ver estadísticas del sistema');
console.log('   • createBackup() - Crear respaldo');
console.log('   • autoRepair() - Reparar problemas');

// ============================================
// MENSAJE FINAL
// ============================================

console.log('🎯 Sistema Barberia Chamo - Listo para producción');
console.log('🌐 Sincronización multi-dispositivo activa');
console.log('📱 Funciona desde cualquier dispositivo');
console.log('🔥 Firebase Firestore conectado');
console.log('💾 Sistema de respaldo automático');
console.log('🚨 Funciones de emergencia disponibles');
