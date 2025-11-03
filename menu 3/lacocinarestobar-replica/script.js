// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    hamburger.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        
        // Animate hamburger
        hamburger.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    // Menu Category Filtering
    const categoryButtons = document.querySelectorAll('.category-btn');
    const menuItems = document.querySelectorAll('.menu-item');

    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filter menu items
            menuItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                
                if (category === 'todos' || itemCategory === category) {
                    item.style.display = 'block';
                    // Animate in
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 100);
                } else {
                    // Animate out
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // Smooth scrolling for navigation links
    const navLinksSmooth = document.querySelectorAll('a[href^="#"]');
    navLinksSmooth.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header background on scroll
    const header = document.querySelector('.header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    });

    // Contact Form Handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const formObject = {};
            formData.forEach((value, key) => {
                formObject[key] = value;
            });

            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;

            // Simulate form submission (replace with actual backend integration)
            setTimeout(() => {
                // Show success message
                showNotification('Mensaje enviado correctamente. ¡Gracias por contactarnos!', 'success');
                this.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }

    // Reservation Form Handling
    const reservationForm = document.getElementById('reservas-form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const formObject = {};
            formData.forEach((value, key) => {
                formObject[key] = value;
            });

            // Basic validation
            if (!validateReservation(formObject)) {
                return;
            }

            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Reservando...';
            submitBtn.disabled = true;

            // Simulate form submission (replace with actual backend integration)
            setTimeout(() => {
                // Show success message
                showNotification('¡Reserva confirmada! Te esperamos en nuestra restaurante.', 'success');
                this.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }

    // Set minimum date for reservation (today)
    const reservationDate = document.getElementById('reserva-fecha');
    if (reservationDate) {
        const today = new Date().toISOString().split('T')[0];
        reservationDate.setAttribute('min', today);
    }

    // Set default time for reservation
    const reservationTime = document.getElementById('reserva-hora');
    if (reservationTime) {
        reservationTime.value = '19:00';
    }
});

// Form validation functions
function validateReservation(data) {
    const { nombre, telefono, email, personas, fecha, hora } = data;
    
    if (!nombre || nombre.trim().length < 2) {
        showNotification('Por favor ingresa un nombre válido', 'error');
        return false;
    }
    
    if (!telefono || telefono.trim().length < 8) {
        showNotification('Por favor ingresa un teléfono válido', 'error');
        return false;
    }
    
    if (!email || !isValidEmail(email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        return false;
    }
    
    if (!personas || personas < 1 || personas > 20) {
        showNotification('El número de personas debe estar entre 1 y 20', 'error');
        return false;
    }
    
    if (!fecha) {
        showNotification('Por favor selecciona una fecha', 'error');
        return false;
    }
    
    if (!hora) {
        showNotification('Por favor selecciona una hora', 'error');
        return false;
    }

    // Check if the selected time is within business hours
    const selectedTime = new Date(`2000-01-01T${hora}`);
    const openingTime = new Date(`2000-01-01T12:00`);
    const closingTime = new Date(`2000-01-01T23:00`);
    
    if (selectedTime < openingTime || selectedTime > closingTime) {
        showNotification('Por favor selecciona una hora dentro de nuestro horario de atención (12:00 - 23:00)', 'error');
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;

    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    `;

    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Close functionality
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });

    // Auto close after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Animate elements on scroll
function animateOnScroll() {
    const elements = document.querySelectorAll('.menu-item, .gallery-item, .feature');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// Initialize animations when page loads
window.addEventListener('load', animateOnScroll);

// Add loading animation to forms
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.disabled) {
                submitBtn.style.position = 'relative';
                submitBtn.style.color = 'transparent';
                
                // Add spinner
                const spinner = document.createElement('div');
                spinner.className = 'spinner';
                spinner.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 20px;
                    height: 20px;
                    border: 2px solid transparent;
                    border-top: 2px solid currentColor;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                `;
                
                // Add keyframes if not exists
                if (!document.querySelector('#spinner-keyframes')) {
                    const style = document.createElement('style');
                    style.id = 'spinner-keyframes';
                    style.textContent = `
                        @keyframes spin {
                            0% { transform: translate(-50%, -50%) rotate(0deg); }
                            100% { transform: translate(-50%, -50%) rotate(360deg); }
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                submitBtn.appendChild(spinner);
            }
        });
    });
});
