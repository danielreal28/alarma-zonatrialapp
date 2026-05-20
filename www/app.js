let alarmTime = null;
let isAlarmSet = false;

const currentTimeDisplay = document.getElementById('current-time');
const currentDateDisplay = document.getElementById('current-date');
const alarmStatus = document.getElementById('alarm-status');
const btnToggle = document.getElementById('btn-toggle');

// 1. Reloj en tiempo real
function updateClock() {
    const now = new Date();
    let hours = String(now.getHours()).padStart(2, '0');
    let minutes = String(now.getMinutes()).padStart(2, '0');
    let seconds = String(now.getSeconds()).padStart(2, '0');
    currentTimeDisplay.innerText = `${hours}:${minutes}:${seconds}`;
    
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    currentDateDisplay.innerText = now.toLocaleDateString('es-ES', options);
}

// 2. Pedir permisos y configurar canales de alta prioridad
async function requestPermissions() {
    if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
        const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
        
        await LocalNotifications.requestPermissions();

        try {
            // Crear los 10 canales indicándole a Android que son de importancia máxima
            for (let i = 1; i <= 10; i++) {
                await LocalNotifications.createChannel({
                    id: `canal_alarma${i}`,
                    name: `Canal Alarma ${i}`,
                    description: `Canal para tono ${i}`,
                    importance: 5, // Máxima prioridad (Suena aunque esté bloqueado)
                    sound: `alarma${i}`, // Nombre del archivo mp3 en res/raw
                    visibility: 1, // Visible en pantalla de bloqueo
                    vibration: true
                });
            }
            console.log("Canales nativos configurados con éxito.");
        } catch (error) {
            console.error("Error en canales nativos:", error);
        }
    }
}

// 3. Activar / Desactivar Alarma
async function toggleAlarm() {
    if (!window.Capacitor || !window.Capacitor.Plugins.LocalNotifications) {
        alert("El modo nativo se activará en el APK.");
        return;
    }

    const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;

    if (isAlarmSet) {
        // Cancela la alarma y detiene el sonido
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

        // Si la hora ya pasó hoy, se programa para mañana
        if (triggerDate <= now) {
            triggerDate.setDate(triggerDate.getDate() + 1);
        }

        const soundNameClean = selectedSound.replace('.mp3', '');

        // Programar la alerta nativa del sistema
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "🚨 ¡Alarma ZonaTrial!",
                    body: "Es hora de despertar. Entra a la app para apagar el sonido.",
                    id: 1,
                    schedule: { at: triggerDate, allowWhileIdle: true },
                    sound: soundNameClean, 
                    channelId: `canal_${soundNameClean}`,
                    ongoing: true, // No se puede borrar deslizando el dedo
                    vibration: true,
                    // TRUCO DE BUCLE NATIVO: Le dice al sistema operativo que repita el sonido
                    soundConfig: {
                        loop: true
                    }
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
