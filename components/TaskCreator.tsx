import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  Platform,
  TouchableOpacity,
  FlatList,
  Appearance,
  ColorSchemeName,
} from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import * as SQLite from 'expo-sqlite'
import { useState, useEffect } from 'react'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import * as DocumentPicker from 'expo-document-picker'

interface IName {
  id: number
  name: string
}

export default function TaskComponent() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase>(SQLite.openDatabase('example.db'))
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [names, setNames] = useState<IName[]>([])
  const [currentName, setCurrentName] = useState<string>('')
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme() || 'light')

  const styles = createStyles(colorScheme || 'light')

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme)
    })
    return () => subscription.remove()
  }, [])

  const exportDb = async (): Promise<void> => {
    try {
      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync()
        if (!permissions.granted) {
          console.log('Permission not granted')
          return
        }

        const base64 = await FileSystem.readAsStringAsync(`${FileSystem.documentDirectory}SQLite/example.db`, {
          encoding: FileSystem.EncodingType.Base64,
        })

        const uri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          'example.db',
          'application/octet-stream'
        )

        await FileSystem.writeAsStringAsync(uri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        })
      } else {
        await Sharing.shareAsync(`${FileSystem.documentDirectory}SQLite/example.db`)
      }
    } catch (error) {
      console.error('Error exporting database:', error)
    }
  }

  const importDb = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets) {
        setIsLoading(true)

        const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite`)

        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`)
        }

        const file = result.assets[0]

        if (file) {
          const base64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          })

          await FileSystem.writeAsStringAsync(`${FileSystem.documentDirectory}SQLite/example.db`, base64, {
            encoding: FileSystem.EncodingType.Base64,
          })

          setDb(SQLite.openDatabase('example.db'))
        }
      }
    } catch (error) {
      console.error('Error importing database:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const createTable = () => {
      db.transaction((tx) => {
        tx.executeSql('CREATE TABLE IF NOT EXISTS names (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);')
      })
    }

    const fetchNames = () => {
      db.transaction((tx) => {
        tx.executeSql('SELECT * FROM names', [], (txObj, resultSet) => {
          setNames(resultSet.rows._array || [])
        })
      })
    }

    createTable()
    fetchNames()
    setIsLoading(false)
  }, [db])

  const addName = (): void => {
    if (!currentName.trim()) return

    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO names (name) values (?)',
        [currentName],
        (txObj, resultSet) => {
          const id = resultSet.insertId
          if (id === undefined) {
            console.error('Failed to retrieve insertId')
            return
          }

          setNames((prevNames) => [...prevNames, { id: id, name: currentName }])
          setCurrentName('')
        },
        (_txObj, error) => {
          console.error('Error adding name:', error)
          return false
        }
      )
    })
  }

  const deleteName = (id: number): void => {
    db.transaction((tx) => {
      tx.executeSql(
        'DELETE FROM names WHERE id = ?',
        [id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            setNames((prevNames) => prevNames.filter((name) => name.id !== id))
          }
        },
        (_txObj, error) => {
          console.error('Error deleting name:', error)
          return false
        }
      )
    })
  }

  const updateName = (id: number): void => {
    if (!currentName.trim()) return

    db.transaction((tx) => {
      tx.executeSql(
        'UPDATE names SET name = ? WHERE id = ?',
        [currentName, id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            setNames((prevNames) => prevNames.map((name) => (name.id === id ? { ...name, name: currentName } : name)))
            setCurrentName('')
          }
        },
        (_txObj, error) => {
          console.error('Error updating name:', error)
          return false
        }
      )
    })
  }

  const showNames = (): JSX.Element => (
    <FlatList
      data={names}
      keyExtractor={(item) => item.id.toString()}
      style={styles.list}
      scrollEnabled={true}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
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

const createStyles = (colorScheme: 'light' | 'dark') => {
  return StyleSheet.create({
    container: {
      width: '80%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colorScheme === 'dark' ? 'black' : 'white',
    },
    input: {
      color: colorScheme === 'dark' ? 'white' : 'black',
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'white' : 'black',
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 20,
      width: '100%',
    },
    button: {
      backgroundColor: colorScheme === 'dark' ? 'white' : 'black',
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 20,
      marginVertical: 10,
    },
    buttonText: {
      textAlign: 'center',
      color: colorScheme === 'dark' ? 'black' : 'white',
    },
    list: {
      width: '100%',
    },
    text: {
      color: colorScheme === 'dark' ? 'white' : 'black',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      margin: 8,
    },
    rowItem: {
      height: 50,
      backgroundColor: colorScheme === 'dark' ? 'black' : 'white',
      justifyContent: 'center',
      padding: 10,
    },
    rightAction: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      height: 50,
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
}
