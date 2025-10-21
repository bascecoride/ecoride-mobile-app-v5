import { View, Text, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { uiStyles } from "@/styles/uiStyles";
import { router } from "expo-router";
import { RFValue } from "react-native-responsive-fontsize";
import CustomText from "../shared/CustomText";
import { commonStyles } from "@/styles/commonStyles";
import ProfileModal from "./ProfileModal";

const cubes = [
  { name: "Single", imageUri: require("@/assets/icons/SingleMotorcycle-NoBG.png") },
  { name: "Tricycle", imageUri: require("@/assets/icons/Tricycle-NoBG.png") },
  { name: "Four Wheel", imageUri: require("@/assets/icons/Car-NoBG.png") },
 // { name: "Coming Soon...", imageUri: require("@/assets/icons/coming_soon.png") },
 // { name: "Four Wheel Premium", imageUri: require("@/assets/icons/cab_premium.png") },
];

const SheetContent = () => {
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  return (
    <View style={{ height: "100%" }}>
      <TouchableOpacity
        style={uiStyles.searchBarContainer}
        onPress={() => router.push({
          pathname: "/customer/selectlocations"
        })}
      >
        <Ionicons name="search-outline" size={RFValue(16)} color="black" />
        <CustomText fontFamily="Medium" fontSize={11}>
          Where are you going?
        </CustomText>
      </TouchableOpacity>

      <View style={commonStyles.flexRowBetween}>
        <CustomText fontFamily="Medium" fontSize={11}>
          Explore
        </CustomText>

        <TouchableOpacity style={commonStyles.flexRow}>
          <CustomText fontFamily="Regular" fontSize={10}>
            View All
          </CustomText>
          <Ionicons name="chevron-forward" size={RFValue(14)} color="black" />
        </TouchableOpacity>
      </View>

      <View style={uiStyles.cubes}>
        {cubes?.slice(0, 4).map((item, index) => (
          <TouchableOpacity
            style={uiStyles.cubeContainer}
            key={index}
            onPress={() => router.push({
              pathname: "/customer/selectlocations"
            })}
          >
            <View style={uiStyles.cubeIconContainer}>
              <Image source={item?.imageUri} style={uiStyles.cubeIcon} />
            </View>
            <CustomText
              fontFamily="Medium"
              fontSize={9.5}
              style={{ textAlign: "center" }}
            >
              {item?.name}
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Profile Button 
      <TouchableOpacity
        style={uiStyles.profileButton}
        onPress={() => setProfileModalVisible(true)}
      >
        <Ionicons name="person-circle-outline" size={RFValue(18)} color="#00B14F" />
        <CustomText fontFamily="Medium" fontSize={11} style={{ marginLeft: 8 }}>
          My Profile
        </CustomText>
      </TouchableOpacity> 

      <View style={uiStyles.adSection}>
        <Image
          source={require("@/assets/images/ecoride_ad2.png")}
          style={uiStyles.adImage}
        />
      </View> */}

      <View style={uiStyles.bannerContainer}>
        <Image
          source={require("@/assets/images/ecoride_footer.png")}
          style={uiStyles.banner}
        />
      </View>

      <ProfileModal 
        visible={profileModalVisible} 
        onClose={() => setProfileModalVisible(false)} 
      />
      
    </View>
  );
};

export default SheetContent;
