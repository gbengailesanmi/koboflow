import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { Account, Transaction } from '@money-mapper/shared/types'

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Money Mapper Mobile</Text>
      <Text style={styles.subtitle}>Coming Soon</Text>
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
})
