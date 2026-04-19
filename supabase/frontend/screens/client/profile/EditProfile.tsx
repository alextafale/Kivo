import { View, Text } from "react-native";
import { useTheme } from '../../../application/context/ThemeContext';

export default function EdithProfile() {
    const { colors } = useTheme();
    return (
        <View style={{ flex: 1, backgroundColor: colors.pageBg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.titleText }}>EdithProfile</Text>
        </View>
    );
}