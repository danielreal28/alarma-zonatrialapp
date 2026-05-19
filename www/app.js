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

// 2. Pedir permisos y CONFIGURAR CANALES DE AUDIO nativos en Android
async function requestPermissions() {
    if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
        const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
        
        // Pedir permisos del sistema
        await LocalNotifications.requestPermissions();

        // Crear los canales de audio del 1 al 10 para que Android los reconozca con alta prioridad
        try {
            for (let i = 1; i <= 10; i++) {
                await LocalNotifications.createChannel({
                    id: `canal_alarma${i}`,
                    name: `Canal Alarma ${i}`,
                    description: `Canal para reproducir el tono ${i}`,
                    importance: 5, // Importancia Máxima (Fuerza el sonido en Android)
                    sound: `alarma${i}`, // Nombre del archivo en res/raw sin .mp3
                    visibility: 1,
                    vibration: true
                });
            }
            console.log("Canales de audio registrados con éxito.");
        } catch (error) {
            console.error("Error al crear canales de audio:", error);
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

        // Limpiar el nombre (ej: "alarma1.mp3" pasa a "alarma1")
        const soundNameClean = selectedSound.replace('.mp3', '');

        // Registrar la alarma apuntando al canal de sonido correspondiente
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "¡Alarma ZonaTrial!",
                    body: "Es hora de despertar, Daniel.",
                    id: 1,
                    schedule: { at: triggerDate, allowWhileIdle: true },
                    sound: soundNameClean, 
                    channelId: `canal_${soundNameClean}`, // ENLAZA LA ALARMA AL CANAL DE AUDIO EXCLUSIVO
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
