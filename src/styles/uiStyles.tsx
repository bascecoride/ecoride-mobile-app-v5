import { Colors, screenWidth } from "@/utils/Constants";
import { StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

export const uiStyles = StyleSheet.create({
    absoluteTop: {
        zIndex: 1,
        position: "absolute",
        top: 0
    },
    container: {
        flexDirection: 'row',
        alignItems: "center",
        paddingHorizontal: 15,
        overflow: "hidden",
        paddingVertical: 10,
        justifyContent: 'space-between'
    },
    btn: {
        backgroundColor: Colors.background,
        borderRadius: 100,
        justifyContent: 'center',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowColor: '#000',
        elevation: 10,
        alignItems: 'center',
        padding: 10,
        width: 44,
        height: 44
    },
    dot: {
        width: 6,
        height: 6,
        backgroundColor: "#62cf23",
        borderRadius: 100,
        marginHorizontal: 10
    },
    locationBar: {
        width: '53%',
        backgroundColor: "white",
        borderRadius: 15,
        height: 44,
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowColor: '#000',
        elevation: 10,
        gap: 1,
        alignItems: 'center',
        flexDirection: 'row',
    },
    locationText: {
        width: '76%',
        fontSize: RFValue(10),
        fontFamily: 'Regular',
        color: Colors.text,
        opacity: 0.8
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 10,
        marginBottom: 20,
        padding: 10,
        backgroundColor: Colors.secondary_light
    },
    cubeContainer: {
        width: '22.8%',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    cubeIcon: {
        width: '100%',
        height: 45,
        aspectRatio: 1 / 1,
        resizeMode: "contain",
    },
    cubeIconContainer: {
        width: '100%',
        padding: 10,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        height: 60,
        marginBottom: 10,
        backgroundColor: '#E5E7EA'
    },
    cubes: {
        flexDirection: 'row',
        height: 200,
        marginVertical: 20,
        alignItems: 'baseline',
        width: '137%',
        justifyContent: 'flex-start',
    },
    adImage: {
        height: '100%',
        width: '100%',
        resizeMode: 'cover'
    },
    adSection: {
        width: '100%',
        backgroundColor: '#E5E7EA',
        marginVertical: 10,
        height: 100
    },
    banner: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',

    },
    bannerContainer: {
        width: '100%',
        height: screenWidth,
        marginBottom: 100
    },
    locationInputs: {
        padding: 15,
        borderBottomWidth: 1,
        borderColor: '#ccc'
    },
    suggestionText: {
        marginTop: 6,
        color: '#666',
        textTransform: 'capitalize'
    },
    mapPinIcon: {
        width: 20,
        marginRight: 10,
        height: 20,
        resizeMode: 'contain'
    },
    profileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowColor: '#000',
        elevation: 2,
    },
    buttonGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    }
})