import React from 'react'
import { StyleSheet } from 'react-native'

import { ExternalLink } from './ExternalLink'
import { MonoText } from './StyledText'
import { Text, View } from './Themed'

export default function EditScreenInfo({ path, text }: { path: string, text: string }) {
  return (
    <View>
      <View style={styles.getStartedContainer}>
        <Text style={styles.getStartedText} lightColor="rgba(0,0,0,0.8)" darkColor="rgba(255,255,255,0.8)">
          {text}
        </Text>

        <View
          style={[styles.codeHighlightContainer, styles.homeScreenFilename]}
          darkColor="rgba(255,255,255,0.05)"
          lightColor="rgba(0,0,0,0.05)"
        >
          <ExternalLink style={styles.helpLink} href={path}>
            <MonoText>{path}</MonoText>
          </ExternalLink>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 15,
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightContainer: {
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedText: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  helpContainer: {
    marginTop: 15,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
    paddingHorizontal: 10
  },
  helpLinkText: {
    textAlign: 'center',
  },
})
