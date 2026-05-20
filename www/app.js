let alarmTime = null;
let isAlarmSet = false;
let audioPlayer = null; // Reproductor nativo para forzar el bucle infinito
let checkInterval = null; // Verificador de hora segundo a segundo

const currentTimeDisplay = document.getElementById('current-time');
const currentDateDisplay = document.getElementById('current-date');
const alarmStatus = document.getElementById('alarm-status');
const btnToggle = document.getElementById('btn-toggle');

// 1. Reloj en tiempo real y verificador de alarma
function updateClock() {
    const now = new Date();
    let hours = String(now.getHours()).padStart(2, '0');
    let minutes = String(now.getMinutes()).padStart(2, '0');
    let seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    currentTimeDisplay.innerText = `${hours}:${minutes}:${seconds}`;
    
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    currentDateDisplay.innerText = now.toLocaleDateString('es-ES', options);

    // Si la alarma está activa y coincide el minuto exacto con el segundo 00
    if (isAlarmSet && alarmTime === timeString && now.getSeconds() === 0) {
        dispararAlarmaEfectiva();
    }
}

// 2. Pedir permisos iniciales de notificación para el sistema
async function requestPermissions() {
    if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
        const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
        await LocalNotifications.requestPermissions();
    }
}

// 3. El Motor que hace sonar el Bucle Infinito
function dispararAlarmaEfectiva() {
    const selectedSound = document.getElementById('alarm-sound').value;
    
    // Si ya está sonando algo, lo detenemos primero
    if (audioPlayer) {
        audioPlayer.pause();
    }

    // Cargamos el audio directamente desde la carpeta web raíz
    // Al usar el elemento Audio nativo con loop=true, Android no puede cortar el sonido
    audioPlayer = new Audio(selectedSound);
    audioPlayer.loop = true; 
    audioPlayer.volume = 1.0;
    
    // Lanzamos la reproducción
    audioPlayer.play().catch(err => {
        console.error("Error reproduciendo audio en bucle: ", err);
        // Respaldo por si Android bloquea el inicio directo
        document.body.click(); 
    });

    // Lanzar notificación visual flotante de respaldo
    if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
        window.Capacitor.Plugins.LocalNotifications.schedule({
            notifications: [{
                title: "🚨 ¡Alarma ZonaTrial!",
                body: "Entra a la aplicación para detener el sonido en bucle.",
                id: 1,
                ongoing: true
            }]
        });
    }

    if (alarmStatus) alarmStatus.innerText = "¡Sonando en bucle infinito!";
}

// 4. Detener todo por completo
async function apagarAlarmaManual() {
    // Apagar el reproductor de sonido continuo
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        audioPlayer = null;
    }

    // Cancelar notificaciones activas
    if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
        await window.Capacitor.Plugins.LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    }

    isAlarmSet = false;
    alarmTime = null;
    
    if (btnToggle) {
        btnToggle.innerText = "Activar Alarma";
        btnToggle.classList.remove('active');
    }
    if (alarmStatus) alarmStatus.innerText = "Alarma desactivada";
}

// 5. Activar/Desactivar desde el botón principal
async function toggleAlarm() {
    if (isAlarmSet) {
        await apagarAlarmaManual();
    } else {
        const inputTime = document.getElementById('alarm-time').value;
        if (!inputTime) {
            alert("Selecciona una hora válida primero.");
            return;
        }

        alarmTime = inputTime;
        isAlarmSet = true;
        btnToggle.innerText = "Desactivar Alarma";
        btnToggle.classList.add('active');
        
        const selectElement = document.getElementById('alarm-sound');
        const textSound = selectElement.options[selectElement.selectedIndex].text;
        alarmStatus.innerText = `Sonará a las ${alarmTime} con ${textSound}`;
    }
}

// Iniciar los bucles de tiempo del sistema web
setInterval(updateClock, 1000);
updateClock();
document.addEventListener('DOMContentLoaded', requestPermissions);
