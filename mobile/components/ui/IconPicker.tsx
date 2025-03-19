// iconPicker.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCategoryContext } from '@/context/CategoryContext';

interface IconPickerProps {
  onIconSelect?: (icon: string) => void; // 옵션: 외부에서 추가 핸들러 제공 가능
}

const IconPicker: React.FC<IconPickerProps> = ({ onIconSelect }) => {
  // Context에서 아이콘 및 색상 관련 상태와 함수 가져오기
  const { selectedIcon, setSelectedIcon, availableIcons, selectedColor } = useCategoryContext();

  const iconSelected = (icon: string) => {
    setSelectedIcon(icon);
    
    // 외부에서 제공한 핸들러가 있으면 호출
    if (onIconSelect) {
      onIconSelect(icon);
    }
  };

  return (
    <View style={styles.iconPickerContainer}>
      <Text style={styles.title}>Select Icon</Text>
      <ScrollView horizontal contentContainerStyle={styles.iconsContainer}>
        {availableIcons.map((icon, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.iconItem, 
              selectedIcon === icon && [styles.selectedIconItem, { backgroundColor: selectedColor }]
            ]}
            onPress={() => iconSelected(icon)}
          >
            <Ionicons 
              name={icon} 
              size={24} 
              color={selectedIcon === icon ? '#fff' : '#666'} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  iconPickerContainer: {
    marginVertical: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  iconsContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  iconItem: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
  },
  selectedIconItem: {
    // backgroundColor는 이제 동적으로 selectedColor를 사용
  },
});

export default IconPicker;