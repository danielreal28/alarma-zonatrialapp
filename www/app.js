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

// 2. Configurar Canales de Alerta Crítica y Botones Visibles
async function requestPermissions() {
    if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
        const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
        
        await LocalNotifications.requestPermissions();

        try {
            // REGISTRO DE BOTÓN ULTRA-VISIBLE (Con ID en mayúsculas para evitar fallos de mapeo)
            await LocalNotifications.registerActionTypes({
                types: [
                    {
                        id: 'ALARM_RING_ACTIONS',
                        actions: [
                            {
                                id: 'stop_alarm',
                                title: '🔴 APAGAR ALARMA',
                                foreground: true
                            }
                        ]
                    }
                ]
            });

            // Crear canales nativos con visibilidad TOTAL en pantalla bloqueada
            for (let i = 1; i <= 10; i++) {
                await LocalNotifications.createChannel({
                    id: `canal_alarma${i}`,
                    name: `Canal Alarma ${i}`,
                    description: `Canal crítico para tono ${i}`,
                    importance: 5,     // IMPORTANCIA MÁXIMA (Rompe el silencio)
                    visibility: 1,     // VISIBILIDAD DE PANTALLA DE BLOQUEO (Muestra botones)
                    sound: `alarma${i}`,
                    vibration: true
                });
            }
            console.log("Canales blindados listos.");
        } catch (error) {
            console.error("Error configurando canales:", error);
        }

        // Capturar cuando se presione el botón desde la barra de bloqueo
        LocalNotifications.addListener('localNotificationActionPerformed', async (notificationAction) => {
            if (notificationAction.actionId === 'stop_alarm') {
                await apagarAlarmaManual();
            }
        });
    }
}

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

// 3. Programar el Disparo de Alarma
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
            alert("Selecciona una hora válida.");
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

        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "🚨 ¡Alarma ZonaTrial!",
                    body: "Presiona el botón rojo para apagar el sonido.",
                    id: 1,
                    schedule: { at: triggerDate, allowWhileIdle: true },
                    sound: soundNameClean, 
                    channelId: `canal_${soundNameClean}`,
                    actionTypeId: 'ALARM_RING_ACTIONS', // Conecta con el botón configurado arriba
                    ongoing: true,      // Impide que el usuario borre la notificación barriendo el dedo
                    sticky: true,       // Fuerza a que permanezca activa en pantalla
                    smallIcon: 'res://res_id_icon', // Usa el icono nativo
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
