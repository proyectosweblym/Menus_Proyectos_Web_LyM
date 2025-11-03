# ✂️ Alex Barber - Sistema de Reservas Profesional

Sistema completo de reservas para barbería con sincronización en tiempo real entre dispositivos usando Firebase Firestore.

## 🚀 Características Principales

### ✅ **Sistema de Reservas**
- Formulario completo de reservas con validación
- Verificación de horarios disponibles/ocupados en tiempo real
- Prevención de doble reserva
- Integración automática con WhatsApp
- Persistencia de datos en localStorage + Firebase

### ✅ **Panel de Administración**
- Login con contraseña (admin123)
- Gestión completa de reservas (ver, eliminar, exportar)
- Sistema de días bloqueados
- Configuración del sistema
- Exportación de datos a archivos

### ✅ **Sincronización Multi-Dispositivo**
- **Firebase Firestore** para almacenamiento en la nube
- **Sincronización en tiempo real** entre dispositivos
- **Listeners automáticos** que detectan cambios
- **Fallback automático** a localStorage si Firebase falla

### ✅ **Características Avanzadas**
- Autoguardado automático cada 2 segundos
- Respaldos automáticos diarios
- Reportes automáticos (diarios y semanales)
- Recuperación automática de errores
- Sistema de emergencia integrado

## 📋 Configuración Inicial

### **Opción 1: Usar con Firebase (Recomendado)**

1. **Crear proyecto en Firebase:**
   - Ve a [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Crea un nuevo proyecto llamado `barberia-chamo`
   - Habilita **Firestore Database** en modo de prueba

2. **Obtener credenciales:**
   - Proyecto > Configuración > Configuración general > Tus apps > Web
   - Copia las credenciales y reemplaza en `index.html` líneas 18-26

3. **Configuración básica:**
   ```javascript
   const firebaseConfig = {
     apiKey: "tu-api-key-real",
     authDomain: "tu-proyecto.firebaseapp.com",
     projectId: "tu-proyecto",
     storageBucket: "tu-proyecto.appspot.com",
     messagingSenderId: "tu-sender-id",
     appId: "tu-app-id"
   };
   ```

### **Opción 2: Usar Sin Firebase (Solo localStorage)**
- El sistema funciona perfectamente sin Firebase
- Usa localStorage para persistencia local
- Ideal para desarrollo o sitios estáticos

## 🎯 Cómo Usar

### **Para Clientes:**
1. Haz clic en el botón flotante **"Reservar"**
2. Completa el formulario con:
   - Nombre completo
   - Teléfono
   - Tipo de servicio
   - Fecha y hora preferida
3. El sistema mostrará automáticamente horarios disponibles
4. Se enviará confirmación por WhatsApp

### **Para Administradores:**
1. Haz clic en el botón flotante con ícono de usuario
2. Ingresa contraseña: `admin123`
3. Gestiona reservas, días bloqueados y configuración

## 🔧 Funciones Disponibles en Consola

### **Funciones de Firebase:**
```javascript
testFirebaseConnection()    // Probar conexión Firebase
showFirebaseStats()         // Ver estadísticas Firebase
cleanupFirebaseData()       // Limpiar datos antiguos
reconfigureFirebase(config) // Cambiar configuración
```

### **Funciones de Sistema:**
```javascript
showStats()          // Ver estadísticas del sistema
createBackup()       // Crear respaldo manual
autoRepair()         // Reparar problemas automáticamente
emergencyRecovery()  // Recuperación de emergencia
systemCheck()        // Chequeo completo del sistema
exportAllData()      // Exportar todos los datos
```

### **Funciones de Datos:**
```javascript
exportBookings()     // Exportar reservas a archivo
exportBlockedDays()  // Exportar días bloqueados
clearAllBookings()   // Limpiar todas las reservas
```

## 📱 Tecnologías Utilizadas

- **HTML5** - Estructura semántica y moderna
- **CSS3** - Diseño responsive y atractivo
- **JavaScript ES6+** - Funcionalidades avanzadas
- **Firebase Firestore** - Base de datos en tiempo real
- **Font Awesome** - Iconografía profesional
- **LocalStorage** - Persistencia local como respaldo

## 🌐 Compatibilidad

- ✅ **Navegadores modernos** (Chrome, Firefox, Safari, Edge)
- ✅ **Dispositivos móviles** (iOS, Android)
- ✅ **Tablets y computadoras**
- ✅ **Modo offline** (con localStorage)
- ✅ **PWA ready** (Progressive Web App)

## 📁 Estructura del Proyecto

```
barberia-chamo/
├── index.html          # Página principal
├── script.js           # Lógica JavaScript completa
├── styles.css          # Estilos CSS (ya existente)
├── img/                # Imágenes del trabajo
│   ├── foto 1.jpg
│   ├── foto 2.jpg
│   ├── ...
│   └── logo.jpg
└── README.md           # Esta documentación
```

## 🚨 Solución de Problemas

### **Problema: No hay sincronización entre dispositivos**
**Solución:** Configurar Firebase con credenciales reales:
1. Crear proyecto en Firebase Console
2. Obtener credenciales reales
3. Reemplazar configuración en `index.html`
4. Ejecutar `testFirebaseConnection()` para verificar

### **Problema: Funciones no disponibles**
**Solución:** Ejecutar en consola:
```javascript
systemCheck()        // Diagnóstico completo
emergencyRecovery()  // Si hay problemas mayores
```

### **Problema: Datos perdidos**
**Solución:** El sistema tiene múltiples respaldos:
- localStorage automático
- Respaldos automáticos diarios
- Función de recuperación de emergencia

## 🔒 Seguridad

- **Contraseña de administrador:** `admin123` (cámbiala en producción)
- **Datos sensibles:** Nunca se almacenan en el código
- **localStorage:** Solo datos de reservas y configuración
- **HTTPS recomendado** para producción

## 📞 Soporte

Para soporte técnico o personalización:
- Revisa la consola del navegador para mensajes de error
- Usa las funciones de diagnóstico disponibles
- El sistema incluye recuperación automática de errores

## 🎉 ¡Listo para Usar!

El sistema está completamente funcional y listo para:
- ✅ Recibir reservas en tiempo real
- ✅ Gestionar citas desde cualquier dispositivo
- ✅ Sincronizar datos automáticamente
- ✅ Exportar reportes y estadísticas
- ✅ Funcionar sin conexión a internet (modo local)

**¡Tu barbería ya tiene un sistema profesional de reservas!** ✂️💇‍♂️

---
*Sistema desarrollado con ❤️ para Alex Barber - Estilo y Elegancia*
