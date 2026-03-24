# services/notification_service.py
# Usa la Expo Push API directamente — no requiere firebase-admin ni credenciales FCM
# Expo actúa como intermediario y maneja FCM/APNs por nosotros

import httpx
from typing import Optional

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

ESTADO_MENSAJES = {
    "confirmed":  ("✅ Pedido confirmado",    "Tu pedido fue aceptado por el restaurante"),
    "preparing":  ("👨‍🍳 Preparando tu pedido", "El restaurante está cocinando tu orden"),
    "ready":      ("📦 Listo para recoger",    "Tu pedido está listo, esperando repartidor"),
    "picked_up":  ("🛵 En camino",             "Tu pedido fue recogido y va en camino"),
    "on_the_way": ("🛵 En camino",             "Tu repartidor está en camino"),
    "delivered":  ("🎉 ¡Pedido entregado!",    "Que lo disfrutes. ¡Gracias por tu compra!"),
    "cancelled":  ("❌ Pedido cancelado",       "Tu pedido fue cancelado"),
}


async def send_push_notification(
    expo_push_token: str,
    estado: str,
    order_number: Optional[str] = None,
    pedido_id: Optional[str] = None,
) -> bool:
    """
    Envía una notificación push via Expo Push API.
    Retorna True si fue enviada correctamente, False si falló.
    """
    if not expo_push_token or not expo_push_token.startswith("ExponentPushToken["):
        print(f"[Push] Token inválido: {expo_push_token}")
        return False

    title, body = ESTADO_MENSAJES.get(estado, ("📱 Actualización de pedido", f"Estado: {estado}"))

    if order_number:
        body = f"{order_number} · {body}"

    payload = {
        "to": expo_push_token,
        "title": title,
        "body": body,
        "sound": "default",
        "data": {
            "pedido_id": pedido_id,
            "estado": estado,
            "screen": "orderTracking",
        },
        "channelId": "pedidos",  # Canal Android definido en app.json
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json=payload,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                timeout=10.0,
            )
            result = response.json()

            # Expo devuelve { data: { status: "ok" | "error", ... } }
            if result.get("data", {}).get("status") == "error":
                print(f"[Push] Error de Expo: {result['data'].get('message')}")
                return False

            print(f"[Push] Enviado OK → {expo_push_token[:30]}... estado={estado}")
            return True

    except Exception as e:
        print(f"[Push] Excepción al enviar notificación: {e}")
        return False