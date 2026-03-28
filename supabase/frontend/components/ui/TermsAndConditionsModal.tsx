import React from 'react'
import {
  Modal, View, Text, StyleSheet,
  TouchableOpacity, ScrollView, SafeAreaView,
  StatusBar, Platform
} from 'react-native'
import Svg, { Path } from 'react-native-svg'

type Props = {
  visible: boolean
  onClose: () => void
}

const CloseIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
)

export default function TermsAndConditionsModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.header}>
          <Text style={styles.title}>Términos y Condiciones</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <CloseIcon />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.lastUpdated}>Última actualización: Marzo 2026</Text>
          
          <Text style={styles.sectionTitle}>1. Aceptación de los Términos</Text>
          <Text style={styles.paragraph}>
            Al acceder y utilizar Pidelo, aceptas estar sujeto a estos términos y condiciones. Si no estás de acuerdo con alguna parte, no podrás utilizar la aplicación.
          </Text>

          <Text style={styles.sectionTitle}>2. Uso del Servicio</Text>
          <Text style={styles.paragraph}>
            Pidelo es una plataforma que facilita la conexión entre clientes, negocios de comida y repartidores. Los usuarios deben ser mayores de edad para realizar pedidos o registrarse como negocio/repartidor.
          </Text>

          <Text style={styles.sectionTitle}>3. Responsabilidad de Pedidos</Text>
          <Text style={styles.paragraph}>
            Los negocios son responsables de la calidad y preparación de los alimentos. Los repartidores son responsables del transporte adecuado. Pidelo actúa como intermediario tecnológico.
          </Text>

          <Text style={styles.sectionTitle}>4. Pagos y Reembolsos</Text>
          <Text style={styles.paragraph}>
            Todos los pagos procesados a través de la app están sujetos a verificación. Los reembolsos se aplicarán sólo en casos donde el pedido sea cancelado antes de su preparación, o si ocurren errores atribuibles a la plataforma o al negocio comprobados adecuadamente.
          </Text>

          <Text style={styles.sectionTitle}>5. Privacidad y Datos</Text>
          <Text style={styles.paragraph}>
            La recopilación y uso de datos personales se describe en nuestra Política de Privacidad. Al utilizar la aplicación, consientes nuestras prácticas de procesamiento de datos.
          </Text>

          <View style={styles.footerSpace} />
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity style={styles.acceptButton} onPress={onClose}>
            <Text style={styles.acceptButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'android' && { paddingTop: 40 }),
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
    marginBottom: 8,
  },
  footerSpace: {
    height: 40,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  acceptButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
