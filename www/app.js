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

// 2. Pedir permisos y configurar canales con categoría de ALARMA REAL
async function requestPermissions() {
    if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
        const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
        
        await LocalNotifications.requestPermissions();

        try {
            // Registrar acción para apagar desde la pantalla de bloqueo
            await LocalNotifications.registerActionTypes({
                types: [
                    {
                        id: 'ZONATRIAL_ALARM_ACTIONS',
                        actions: [
                            {
                                id: 'stop',
                                title: '🔴 APAGAR ALARMA',
                                foreground: true
                            }
                        ]
                    }
                ]
            });

            // Configurar canales forzando alertas continuas del sistema
            for (let i = 1; i <= 10; i++) {
                await LocalNotifications.createChannel({
                    id: `canal_alarma${i}`,
                    name: `Canal Alarma ${i}`,
                    description: `Canal de sonido continuo para tono ${i}`,
                    importance: 5, // Máxima prioridad
                    visibility: 1, // Visible sobre el bloqueo
                    sound: `alarma${i}`,
                    vibration: true
                });
            }
            console.log("Canales de sistema despertador listos.");
        } catch (error) {
            console.error("Error en canales nativos:", error);
        }

        // Escuchar el botón de apagado en la pantalla de bloqueo
        LocalNotifications.addListener('localNotificationActionPerformed', async (action) => {
            if (action.actionId === 'stop') {
                await apagarAlarmaManual();
            }
        });
    }
}

async function apagarAlarmaManual() {
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

// 3. Programación nativa
async function toggleAlarm() {
    if (!window.Capacitor || !window.Capacitor.Plugins.LocalNotifications) {
        alert("El modo nativo se activará en el APK.");
        return;
    }

    const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;

    if (isAlarmSet) {
        await apagarAlarmaManual();
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

        // Programar la alerta con los metadatos de alarma del sistema operativo
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "🚨 ¡Alarma ZonaTrial!",
                    body: "Despierta Daniel. Toca abajo para apagar.",
                    id: 1,
                    schedule: { at: triggerDate, allowWhileIdle: true },
                    sound: soundNameClean, 
                    channelId: `canal_${soundNameClean}`,
                    actionTypeId: 'ZONATRIAL_ALARM_ACTIONS',
                    ongoing: true, // Bloquea el borrado accidental
                    extra: {
                        // Parámetro nativo oculto que le dice a Android que use el reproductor infinito de alarmas
                        androidFullScreenIntent: true
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
