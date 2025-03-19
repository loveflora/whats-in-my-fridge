import { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useCategoryContext } from '@/context/CategoryContext';


interface ColorPaletteProps {
  onColorSelect?: (color: string) => void; // 추가 핸들러를 위한 옵션 prop
}


export default function ColorPalette() {
 // Context에서 색상 관련 상태와 함수 가져오기
 const { selectedColor, setSelectedColor, availableColors } = useCategoryContext();

  
 const colorSelected = (color: string) => {
  // Context API의 setSelectedColor 사용
  setSelectedColor(color);
  
  // // 외부에서 제공한 핸들러가 있으면 호출 (필요한 경우)
  // if (onColorSelect) {
  //   onColorSelect(color);
  // }
};
  
    return (
      <View style={styles.colorPaletteContainer}>
      <Text style={styles.title}>Select Color</Text>
      <ScrollView horizontal contentContainerStyle={styles.paletteContainer}>
        {availableColors.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorTag, 
              { backgroundColor: color },
              selectedColor === color && [
                styles.selectedColorTag,
                { borderColor: color } // 동적으로 선택된 색상으로 테두리 색 설정
              ]
            ]}
            onPress={() => colorSelected(color)}
          > {selectedColor === color && (
            <View style={styles.innerCircle}></View> // 선택된 색상 안에 하얀 원을 추가
          )}</TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* 선택된 색상 미리보기 */}
      {/* <View style={[styles.selectedColorPreview, { backgroundColor: selectedColor }]}>
        <Text style={styles.selectedColorText}>Selected: {selectedColor}</Text>
      </View> */}
    </View>
    );
  };



  const styles = StyleSheet.create({
    colorPaletteContainer: {
      marginVertical: 15,
    },
    title: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 10,
    },
    paletteContainer: {
      flexDirection: 'row',
      paddingVertical: 10,
    },
    colorTag: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginHorizontal: 8,
      // borderWidth: 1,
      // borderColor: '#ddd',
    },
    selectedColorTag: {
      borderWidth: 5, // 얇은 테두리
      // marginHorizontal: 12, // 조금 더 여유를 두기 위해 조정
    },
    innerCircle: {
      width: 30,  // 작은 원 크기
      height: 30, // 작은 원 크기
      borderRadius: 50, // 원 모양
      backgroundColor: 'transparent', // 가운데 비어있는 원
      borderWidth: 3,  
      borderColor: 'white', 
    },
    selectedColorPreview: {
      marginTop: 15,
      padding: 10,
      borderRadius: 5,
      alignItems: 'center',
    },
    selectedColorText: {
      color: '#fff',
      fontWeight: 'bold',
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 1,
    }
})
