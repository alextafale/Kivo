// ui/components/MediadorQuejaModal.tsx
// Modal de resolución de quejas con Qwen como mediador IA

import React from 'react'
import {
    Modal,
    View,
    Text,
    Pressable,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
} from 'react-native'
import { useMediadorQueja } from '../../application/hooks/useMediadorQueja'
import type { QuejaContexto, QuejaResolucion } from '../../domain/entities/QuejaResolucion'

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
    visible: boolean
    pedidoId: string
    onClose: () => void
}

// ── Componente principal ──────────────────────────────────────────────────────

export function MediadorQuejaModal({ visible, pedidoId, onClose }: Props) {
    const { estado, contexto, resolucion, error, iniciarQueja, confirmarQueja, resetear } =
        useMediadorQueja()

    // Cargar contexto cuando el modal se abre
    React.useEffect(() => {
        if (visible && pedidoId && estado === 'idle') {
            iniciarQueja(pedidoId)
        }
    }, [visible, pedidoId])

    const handleClose = () => {
        resetear()
        onClose()
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={s.container}>
                {/* Header */}
                <View style={s.header}>
                    <Text style={s.headerTitle}>Reportar problema</Text>
                    <Pressable onPress={handleClose} style={s.closeBtn}>
                        <Text style={s.closeTxt}>✕</Text>
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                    {/* Estado: cargando contexto */}
                    {estado === 'cargando_contexto' && (
                        <LoadingView mensaje="Analizando tu pedido..." />
                    )}

                    {/* Estado: esperando confirmación */}
                    {estado === 'esperando_confirmacion' && contexto && (
                        <ContextoView
                            contexto={contexto}
                            onConfirmar={confirmarQueja}
                            onCancelar={handleClose}
                        />
                    )}

                    {/* Estado: Qwen procesando */}
                    {estado === 'resolviendo' && (
                        <LoadingView mensaje="Nuestro mediador IA está analizando tu caso..." />
                    )}

                    {/* Estado: resuelto */}
                    {estado === 'resuelto' && resolucion && (
                        <ResolucionView resolucion={resolucion} onCerrar={handleClose} />
                    )}

                    {/* Estado: error */}
                    {estado === 'error' && (
                        <ErrorView mensaje={error ?? 'Ocurrió un error'} onReintentar={() => iniciarQueja(pedidoId)} />
                    )}
                </ScrollView>
            </View>
        </Modal>
    )
}

// ── Subcomponente: loading ────────────────────────────────────────────────────

function LoadingView({ mensaje }: { mensaje: string }) {
    return (
        <View style={s.centered}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={s.loadingTxt}>{mensaje}</Text>
        </View>
    )
}

// ── Subcomponente: contexto + confirmación ────────────────────────────────────

function ContextoView({
    contexto,
    onConfirmar,
    onCancelar,
}: {
    contexto: QuejaContexto
    onConfirmar: () => void
    onCancelar: () => void
}) {
    const retraso =
        contexto.tiempoEntregaRealMin != null && contexto.tiempoEstimadoMin != null
            ? contexto.tiempoEntregaRealMin - contexto.tiempoEstimadoMin
            : null

    return (
        <View style={s.section}>
            {/* Resumen del pedido */}
            <Text style={s.sectionTitle}>Resumen del pedido</Text>
            <InfoRow label="Negocio" value={contexto.negocioNombre ?? '—'} />
            <InfoRow label="Total" value={`$${contexto.total.toFixed(2)} MXN`} />

            {/* Análisis de tiempo */}
            <Text style={[s.sectionTitle, { marginTop: 20 }]}>Análisis de tiempos</Text>

            {contexto.tiempoEstimadoMin != null && (
                <InfoRow label="Tiempo estimado" value={`${contexto.tiempoEstimadoMin} min`} />
            )}
            {contexto.tiempoEntregaRealMin != null && (
                <InfoRow label="Tiempo real" value={`${contexto.tiempoEntregaRealMin} min`} />
            )}
            {retraso != null && retraso > 0 && (
                <View style={s.alertRow}>
                    <Text style={s.alertTxt}>⚠️ Tu pedido llegó {retraso} min tarde</Text>
                </View>
            )}

            {/* Desglose de responsabilidad */}
            {(contexto.tiempoNegocioMin != null || contexto.tiempoRepartidorMin != null) && (
                <>
                    <Text style={[s.sectionTitle, { marginTop: 20 }]}>¿Dónde ocurrió el retraso?</Text>

                    {contexto.tiempoNegocioMin != null && (
                        <DesgloseFila
                            label="Preparación del negocio"
                            valor={contexto.tiempoNegocioMin}
                            promedio={contexto.avgTiempoNegocioMin}
                        />
                    )}
                    {contexto.tiempoEsperaRepartidorMin != null && (
                        <DesgloseFila
                            label="Espera del repartidor"
                            valor={contexto.tiempoEsperaRepartidorMin}
                            promedio={null}
                        />
                    )}
                    {contexto.tiempoRepartidorMin != null && (
                        <DesgloseFila
                            label="Trayecto del repartidor"
                            valor={contexto.tiempoRepartidorMin}
                            promedio={contexto.avgTiempoRepartidorMin}
                        />
                    )}
                </>
            )}

            {/* Aviso */}
            <View style={s.infoBox}>
                <Text style={s.infoTxt}>
                    🤖 Nuestro mediador IA analizará estos datos y tomará la decisión más justa para ti.
                </Text>
            </View>

            {/* Acciones */}
            <Pressable style={s.btnPrimary} onPress={onConfirmar}>
                <Text style={s.btnPrimaryTxt}>Enviar queja</Text>
            </Pressable>
            <Pressable style={s.btnSecondary} onPress={onCancelar}>
                <Text style={s.btnSecondaryTxt}>Cancelar</Text>
            </Pressable>
        </View>
    )
}

// ── Subcomponente: resultado de la resolución ─────────────────────────────────

function ResolucionView({
    resolucion,
    onCerrar,
}: {
    resolucion: QuejaResolucion
    onCerrar: () => void
}) {
    const icono = {
        reembolso_parcial: '💸',
        cupon: '🎟️',
        disculpa: '🙏',
    }[resolucion.accion]

    const titulo = {
        reembolso_parcial: 'Reembolso aprobado',
        cupon: 'Cupón generado',
        disculpa: 'Queja registrada',
    }[resolucion.accion]

    return (
        <View style={s.section}>
            <View style={s.resultadoHeader}>
                <Text style={s.resultadoIcono}>{icono}</Text>
                <Text style={s.resultadoTitulo}>{titulo}</Text>
            </View>

            <View style={s.mensajeBox}>
                <Text style={s.mensajeTxt}>{resolucion.mensajeUsuario}</Text>
            </View>

            {resolucion.monto != null && (
                <View style={s.montoBox}>
                    <Text style={s.montoLabel}>Valor</Text>
                    <Text style={s.montoValor}>${resolucion.monto.toFixed(2)} MXN</Text>
                </View>
            )}

            <Pressable style={s.btnPrimary} onPress={onCerrar}>
                <Text style={s.btnPrimaryTxt}>Entendido</Text>
            </Pressable>
        </View>
    )
}

// ── Subcomponente: error ──────────────────────────────────────────────────────

function ErrorView({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
    return (
        <View style={s.centered}>
            <Text style={s.errorTxt}>⚠️ {mensaje}</Text>
            <Pressable style={s.btnPrimary} onPress={onReintentar}>
                <Text style={s.btnPrimaryTxt}>Reintentar</Text>
            </Pressable>
        </View>
    )
}

// ── Subcomponentes auxiliares ─────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={s.infoRow}>
            <Text style={s.infoLabel}>{label}</Text>
            <Text style={s.infoValue}>{value}</Text>
        </View>
    )
}

function DesgloseFila({
    label,
    valor,
    promedio,
}: {
    label: string
    valor: number
    promedio: number | null
}) {
    const excede = promedio != null && valor > promedio * 1.3
    return (
        <View style={s.desgloseFila}>
            <Text style={s.desgloseLabel}>{label}</Text>
            <View style={s.desgloseRight}>
                <Text style={[s.desgloseValor, excede && s.desgloseExcede]}>
                    {valor} min {excede ? '⬆️' : ''}
                </Text>
                {promedio != null && (
                    <Text style={s.desglosePromedio}>promedio: {promedio} min</Text>
                )}
            </View>
        </View>
    )
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    closeBtn: {
        padding: 4,
    },
    closeTxt: {
        fontSize: 16,
        color: '#666',
    },
    scroll: {
        padding: 20,
        paddingBottom: 40,
    },
    centered: {
        alignItems: 'center',
        paddingTop: 60,
        gap: 16,
    },
    loadingTxt: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
    },
    section: {
        gap: 4,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: 4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    alertRow: {
        backgroundColor: '#FFF3E0',
        borderRadius: 8,
        padding: 10,
        marginTop: 4,
    },
    alertTxt: {
        fontSize: 14,
        color: '#E65100',
        fontWeight: '600',
    },
    desgloseFila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    desgloseLabel: {
        fontSize: 14,
        color: '#444',
        flex: 1,
    },
    desgloseRight: {
        alignItems: 'flex-end',
    },
    desgloseValor: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    desgloseExcede: {
        color: '#E53935',
    },
    desglosePromedio: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    infoBox: {
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 14,
        marginTop: 20,
        marginBottom: 8,
    },
    infoTxt: {
        fontSize: 13,
        color: '#555',
        lineHeight: 19,
    },
    btnPrimary: {
        backgroundColor: '#FF6B35',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
    },
    btnPrimaryTxt: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    btnSecondary: {
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    btnSecondaryTxt: {
        color: '#888',
        fontSize: 15,
    },
    resultadoHeader: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 16,
        gap: 8,
    },
    resultadoIcono: {
        fontSize: 48,
    },
    resultadoTitulo: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1a1a1a',
    },
    mensajeBox: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
    },
    mensajeTxt: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    montoBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF8F5',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#FFE0D0',
    },
    montoLabel: {
        fontSize: 14,
        color: '#888',
    },
    montoValor: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FF6B35',
    },
    errorTxt: {
        fontSize: 15,
        color: '#E53935',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
})