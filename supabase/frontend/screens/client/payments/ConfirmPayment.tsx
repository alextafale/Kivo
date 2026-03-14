import React from 'react'
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../../../navigation/StacNavigation'

type ConfirmPaymentNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ConfirmPayment'>
type ConfirmPaymentRouteProp = RouteProp<RootStackParamList, 'ConfirmPayment'>

type Props = {
  navigation: ConfirmPaymentNavigationProp
  route: ConfirmPaymentRouteProp
}

export default function ConfirmPayment({ navigation, route }: Props) {
  const { total, subtotal, costoEnvio, descuento } = route.params

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Confirmar Pago</Text>
        <Text style={styles.detail}>Subtotal: ${subtotal.toFixed(2)}</Text>
        {descuento > 0 && <Text style={styles.detail}>Descuento: -${descuento.toFixed(2)}</Text>}
        <Text style={styles.detail}>Envío: ${costoEnvio.toFixed(2)}</Text>
        <Text style={styles.totalText}>Total a pagar: ${total.toFixed(2)}</Text>
        
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  detail: { fontSize: 16, color: '#666', marginBottom: 10 },
  totalText: { fontSize: 20, fontWeight: 'bold', marginVertical: 30, color: '#000' },
  button: { backgroundColor: '#22c55e', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
})
