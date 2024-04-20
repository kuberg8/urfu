import { StyleSheet, Text, View, TextInput, Button, Platform, TouchableOpacity, FlatList } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'

import * as SQLite from 'expo-sqlite'
import { useState, useEffect } from 'react'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import * as DocumentPicker from 'expo-document-picker'

export default function TaskComponent() {
  const [db, setDb] = useState(SQLite.openDatabase('example.db'))
  const [isLoading, setIsLoading] = useState(true)
  const [names, setNames] = useState<any[]>([])
  const [currentName, setCurrentName] = useState('')

  const exportDb = async () => {
    if (Platform.OS === 'android') {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync()
      if (permissions.granted) {
        const base64 = await FileSystem.readAsStringAsync(FileSystem.documentDirectory + 'SQLite/example.db', {
          encoding: FileSystem.EncodingType.Base64,
        })

        await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          'example.db',
          'application/octet-stream'
        )
          .then(async (uri) => {
            await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 })
          })
          .catch((e) => console.log(e))
      } else {
        console.log('Permission not granted')
      }
    } else {
      await Sharing.shareAsync(FileSystem.documentDirectory + 'SQLite/example.db')
    }
  }

  const importDb = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    })

    if (result.type === 'success') {
      setIsLoading(true)

      if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite')).exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite')
      }

      const base64 = await FileSystem.readAsStringAsync(result.uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'SQLite/example.db', base64, {
        encoding: FileSystem.EncodingType.Base64,
      })
      await db.closeAsync()
      setDb(SQLite.openDatabase('example.db'))
    }
  }

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS names (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)')
    })

    db.transaction((tx) => {
      tx.executeSql('SELECT * FROM names', [], (txObj, resultSet) => setNames(resultSet.rows._array))
    })

    setIsLoading(false)
  }, [db])

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    )
  }

  const addName = () => {
    db.transaction((tx) => {
      tx.executeSql('INSERT INTO names (name) values (?)', [currentName], (txObj, resultSet) => {
        let existingNames = [...names]
        existingNames.push({ id: resultSet.insertId, name: currentName })
        setNames(existingNames)
        setCurrentName('')
      })
    })
  }

  const deleteName = (id: number) => {
    db.transaction((tx) => {
      tx.executeSql('DELETE FROM names WHERE id = ?', [id], (txObj, resultSet) => {
        if (resultSet.rowsAffected > 0) {
          let existingNames = [...names].filter((name) => name.id !== id)
          setNames(existingNames)
        }
      })
    })
  }

  const updateName = (id: number) => {
    db.transaction((tx) => {
      tx.executeSql('UPDATE names SET name = ? WHERE id = ?', [currentName, id], (txObj, resultSet) => {
        if (resultSet.rowsAffected > 0) {
          let existingNames = [...names]
          const indexToUpdate = existingNames.findIndex((name) => name.id === id)
          existingNames[indexToUpdate].name = currentName
          setNames(existingNames)
          setCurrentName('')
        }
      })
    })
  }

  const showNames = () => {
    return (
      <FlatList
        data={names}
        keyExtractor={(item: any) => item.id.toString()}
        style={styles.list}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: any) => (
          <Swipeable
            renderRightActions={() => (
              <View style={styles.rightAction}>
                <TouchableOpacity onPress={() => deleteName(item.id)}>
                  <Text style={styles.deleteButton}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => updateName(item.id)}>
                  <Text style={styles.updateButton}>Update</Text>
                </TouchableOpacity>
              </View>
            )}
          >
            <View style={styles.rowItem}>
              <Text style={styles.text} numberOfLines={1} ellipsizeMode="tail">
                {item.name}
              </Text>
            </View>
          </Swipeable>
        )}
      />
    )
  }

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} value={currentName} onChangeText={setCurrentName} placeholder="Enter task name" />
      <TouchableOpacity style={styles.button} onPress={addName}>
        <Text style={styles.buttonText}>Создать</Text>
      </TouchableOpacity>

      {showNames()}
      <View style={styles.row}>
        <Button title="Export Db" onPress={exportDb} />
        <Button title="Import Db" onPress={importDb} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '80%',
    height: '100%',
  },
  input: {
    color: 'white',
    borderWidth: 1,
    borderColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    width: '100%',
  },
  button: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginVertical: 10,
  },
  buttonText: {
    textAlign: 'center',
    color: 'black',
  },
  list: {
    height: '100%',
  },
  text: {
    color: 'white',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    margin: 8,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    height: 50,
    backgroundColor: 'black'
  },
  rightAction: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: 50
  },
  deleteButton: {
    color: 'white',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: 'red',
  },
  updateButton: {
    color: 'white',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: 'orange',
  },
})
