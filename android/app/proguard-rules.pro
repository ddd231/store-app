# React Native Core
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.hermes.**

# react-native-iap (구독 시스템) - 강화된 규칙
-keep class com.dooboolab.** { *; }
-dontwarn com.dooboolab.**
-keep class com.android.billingclient.** { *; }
-keepclassmembers class com.android.billingclient.** { *; }
-dontwarn com.android.billingclient.**

# Google Play Billing Library - 강화된 규칙
-keep class com.android.vending.billing.** { *; }
-dontwarn com.android.vending.billing.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# react-native-google-mobile-ads
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**

# Expo modules
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# expo-navigation-bar
-keep class expo.modules.navigationbar.** { *; }
-dontwarn expo.modules.navigationbar.**

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }
-dontwarn com.swmansion.reanimated.**

# React Native Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }
-dontwarn com.swmansion.gesturehandler.**

# React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }
-dontwarn com.th3rdwave.safeareacontext.**

# Supabase related
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# General rules for React Native
-keepattributes *Annotation*
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}

# Enhanced Google Play Billing Library 6+ rules
-keep class com.android.billingclient.api.** { *; }
-keep class com.android.billingclient.util.** { *; }
-keepclassmembers class com.android.billingclient.** {
    public *;
}

# Google Play Store billing implementation
-keep class com.google.android.play.billing.** { *; }
-dontwarn com.google.android.play.billing.**

# Subscription offer details for internal testing and production
-keep class * extends com.android.billingclient.api.PurchasesUpdatedListener { *; }
-keep class * extends com.android.billingclient.api.BillingClientStateListener { *; }

# Preserve IAP product details
-keepclassmembers class * {
    @com.android.billingclient.api.ProductDetails$* *;
}

# Keep subscription offer details
-keep class com.android.billingclient.api.ProductDetails$SubscriptionOfferDetails { *; }
-keep class com.android.billingclient.api.ProductDetails$PricingPhase { *; }

# Keep crashlytics
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception