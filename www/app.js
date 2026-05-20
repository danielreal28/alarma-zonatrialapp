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

// 2. Pedir permisos y CONFIGURAR CANALES DE AUDIO REPETITIVOS en Android
async function requestPermissions() {
    if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
        const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
        
        await LocalNotifications.requestPermissions();

        // Crear los 10 canales configurados con prioridad de ALERTA CRÍTICA e infinitos
        try {
            for (let i = 1; i <= 10; i++) {
                await LocalNotifications.createChannel({
                    id: `canal_alarma${i}`,
                    name: `Canal Alarma ${i}`,
                    description: `Canal repetitivo para tono ${i}`,
                    importance: 5, // Importancia Máxima
                    sound: `alarma${i}`,
                    visibility: 1,
                    vibration: true
                });
            }
            console.log("Canales de audio infinito configurados.");
        } catch (error) {
            console.error("Error en canales:", error);
        }
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
        // DETIENE EL SONIDO Y QUITA LA NOTIFICACIÓN FIJA
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
        isAlarmSet = false;
        alarmTime = null;
        btnToggle.innerText = "Activar Alarma";
        btnToggle.classList.remove('active');
        alarmStatus.innerText = "Alarma desactivada";
    } else {
        const inputTime = document.getElementById('alarm-time').value;
        if (!inputTime) {
            alert("Selecciona una hora válida primero.");
            return;
        }

        const selectedSound = document.getElementById('alarm-sound').value;
        const [hours, minutes] = inputTime.split(':');
        const now = new Date();
        const triggerDate = new Date();
        triggerDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (triggerDate <= now) {
            triggerDate.setDate(triggerDate.getDate() + 1);
        }

        const soundNameClean = selectedSound.replace('.mp3', '');

        // Programar notificación persistente y repetitiva
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "¡Alarma ZonaTrial!",
                    body: "Presiona el botón en la app para apagar el sonido.",
                    id: 1,
                    schedule: { at: triggerDate, allowWhileIdle: true },
                    sound: soundNameClean, 
                    channelId: `canal_${soundNameClean}`,
                    ongoing: true, // HACE QUE LA NOTIFICACIÓN SEA FIJA
                    vibration: true
                }
            ]
        });

        alarmTime = inputTime;
        isAlarmSet = true;
        btnToggle.innerText = "Desactivar Alarma";
        btnToggle.classList.add('active');
        
        const selectElement = document.getElementById('alarm-sound');
        const textSound = selectElement.options[selectElement.selectedIndex].text;
        alarmStatus.innerText = `Sonará a las ${alarmTime} con ${textSound}`;
    }
}

setInterval(updateClock, 1000);
updateClock();
document.addEventListener('DOMContentLoaded', requestPermissions);
