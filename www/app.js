let alarmTime = null;
let isAlarmSet = false;

const currentTimeDisplay = document.getElementById('current-time');
const currentDateDisplay = document.getElementById('current-date');
const alarmStatus = document.getElementById('alarm-status');
const btnToggle = document.getElementById('btn-toggle');

// 1. Reloj en tiempo real para la pantalla
function updateClock() {
    const now = new Date();
    let hours = String(now.getHours()).padStart(2, '0');
    let minutes = String(now.getMinutes()).padStart(2, '0');
    let seconds = String(now.getSeconds()).padStart(2, '0');
    currentTimeDisplay.innerText = `${hours}:${minutes}:${seconds}`;
    
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    currentDateDisplay.innerText = now.toLocaleDateString('es-ES', options);
}

// 2. Pedir permisos de notificación al abrir la app
async function requestPermissions() {
    if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
        await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
    }
}

// 3. Activar/Desactivar alarma con el sistema nativo de Android
async function toggleAlarm() {
    if (!window.Capacitor || !window.Capacitor.Plugins.LocalNotifications) {
        alert("El modo de segundo plano nativo se activará cuando compiles la app como APK.");
        return;
    }

    const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;

    if (isAlarmSet) {
        // Cancelar alarma nativa existente
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
        isAlarmSet = false;
        alarmTime = null;
        btnToggle.innerText = "Activar Alarma";
        btnToggle.classList.remove('active');
        alarmStatus.innerText = "Alarma desactivada";
    } else {
        // Capturar hora elegida
        const inputTime = document.getElementById('alarm-time').value;
        if (!inputTime) {
            alert("Selecciona una hora válida primero.");
            return;
        }

        // CAPTURAR EL TONO SELECCIONADO POR EL USUARIO
        const selectedSound = document.getElementById('alarm-sound').value;

        const [hours, minutes] = inputTime.split(':');
        const now = new Date();
        const triggerDate = new Date();
        triggerDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Si la hora ya pasó hoy, programarla para mañana automáticamente
        if (triggerDate <= now) {
            triggerDate.setDate(triggerDate.getDate() + 1);
        }

        // Separar el nombre del archivo para pasárselo limpio a Android (ej: de "alarma1.mp3" a "alarma1")
        const soundNameClean = selectedSound.replace('.mp3', '');

        // Registrar la alarma a nivel de sistema operativo
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "¡Alarma ZonaTrial!",
                    body: "Es hora de despertar, Daniel.",
                    id: 1,
                    schedule: { at: triggerDate, allowWhileIdle: true },
                    sound: soundNameClean, // Android cargará este sonido desde sus recursos internos raw
                    vibration: true
                }
            ]
        });

        alarmTime = inputTime;
        isAlarmSet = true;
        btnToggle.innerText = "Desactivar Alarma";
        btnToggle.classList.add('active');
        
        // Obtener el texto del tono para mostrarlo en el estado
        const selectElement = document.getElementById('alarm-sound');
        const textSound = selectElement.options[selectElement.selectedIndex].text;
        alarmStatus.innerText = `Sonará a las ${alarmTime} con ${textSound}`;
    }
}

setInterval(updateClock, 1000);
updateClock();
document.addEventListener('DOMContentLoaded', requestPermissions);