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

// 2. Pedir permisos, CONFIGURAR CANALES e inyectar botones nativos de bloqueo
async function requestPermissions() {
    if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
        const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
        
        await LocalNotifications.requestPermissions();

        // Registrar los botones de acción rápidos para la pantalla de bloqueo
        try {
            await LocalNotifications.registerActionTypes({
                types: [
                    {
                        id: 'ALARMA_ACCIONES',
                        actions: [
                            {
                                id: 'desactivar',
                                title: '🔴 APAGAR ALARMA',
                                foreground: true // Abre o activa la app para limpiar el proceso
                            }
                        ]
                    }
                ]
            });

            // Crear los 10 canales configurados para repetir sonido
            for (let i = 1; i <= 10; i++) {
                await LocalNotifications.createChannel({
                    id: `canal_alarma${i}`,
                    name: `Canal Alarma ${i}`,
                    description: `Canal repetitivo para tono ${i}`,
                    importance: 5, // Máxima prioridad en Android
                    sound: `alarma${i}`,
                    visibility: 1, // Visible en pantalla de bloqueo
                    vibration: true
                });
            }
            console.log("Configuración nativa de canales lista.");
        } catch (error) {
            console.error("Error en configuración nativa:", error);
        }

        // ESCUCHAR CUANDO SE TOCA EL BOTÓN "APAGAR ALARMA" DESDE LA PANTALLA DE BLOQUEO
        LocalNotifications.addListener('localNotificationActionPerformed', async (notificationAction) => {
            if (notificationAction.actionId === 'desactivar') {
                await apagarAlarmaManual();
            }
        });
    }
}

// Función central para apagar la alarma y limpiar todo
async function apagarAlarmaManual() {
    const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    isAlarmSet = false;
    alarmTime = null;
    if(btnToggle) {
        btnToggle.innerText = "Activar Alarma";
        btnToggle.classList.remove('active');
    }
    if(alarmStatus) alarmStatus.innerText = "Alarma desactivada";
}

// 3. Activar/Desactivar alarma
async function toggleAlarm() {
    if (!window.Capacitor || !window.Capacitor.Plugins.LocalNotifications) {
        alert("El modo de segundo plano nativo se activará cuando compiles la app como APK.");
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

        // Programar alarma con sonido infinito en bucle y botón en bloqueo
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "🚨 ¡Alarma ZonaTrial!",
                    body: "Toca abajo para detener el sonido de inmediato.",
                    id: 1,
                    schedule: { at: triggerDate, allowWhileIdle: true },
                    sound: soundNameClean, 
                    channelId: `canal_${soundNameClean}`,
                    actionTypeId: 'ALARMA_ACCIONES', // INYECTA EL BOTÓN EN LA PANTALLA DE BLOQUEO
                    ongoing: true, // Bloquea que el usuario borre la notificación deslizando
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
