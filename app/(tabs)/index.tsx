import { StyleSheet } from 'react-native'

import EditScreenInfo from '@/components/EditScreenInfo'
import { Text, View } from '@/components/Themed'

export default function TabOneScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Работа с Realm на React Native</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="https://github.com/realm/realm-js" text={text} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '90%',
  },
})

const text =
  'Realm - кроссплатформенная объектная СУБД с открытым исходным кодом для Android и iOS.\nReact Native — кроссплатформенный фреймворк с открытым исходным кодом для разработки нативных мобильных приложений на JavaScript и TypeScript.'
