import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  icon?: string;
  rotation?: number;
  type?: string;
  category?: string;
  description?: string;
  isPinLocation?: boolean;
}

interface WebViewMapProps {
  style?: any;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers?: Marker[];
  showUserLocation?: boolean;
  enableLiveTracking?: boolean;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
  onRegionChange?: (region: any) => void;
  onMarkerPress?: (marker: any) => void;
  onPinLocationSelect?: (pinLocation: any) => void;
  onLoad?: () => void;
  onError?: () => void;
  showDirections?: boolean;
  directionsConfig?: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    strokeColor?: string;
    strokeWidth?: number;
  };
  customMapStyle?: any;
  showPolyline?: boolean;
  polylineCoordinates?: { latitude: number; longitude: number }[];
  polylineConfig?: {
    strokeColor?: string;
    strokeWidth?: number;
    strokePattern?: number[];
  };
  showPinLocations?: boolean;
}

export interface WebViewMapRef {
  fitToCoordinates: (coordinates: { latitude: number; longitude: number }[], options?: any) => void;
  animateToRegion: (region: any) => void;
  animateToCoordinate: (coordinate: { latitude: number; longitude: number }) => void;
  getCurrentLocation: () => void;
  startLiveTracking: () => void;
  stopLiveTracking: () => void;
  updateMarkers: (markersData: Marker[]) => void;
}

const WebViewMap = forwardRef<WebViewMapRef, WebViewMapProps>(({
  style,
  initialRegion,
  markers = [],
  showUserLocation = false,
  enableLiveTracking = false,
  onLocationUpdate,
  onRegionChange,
  onMarkerPress,
  onPinLocationSelect,
  onLoad,
  onError,
  showDirections = false,
  directionsConfig,
  customMapStyle,
  showPolyline = false,
  polylineCoordinates = [],
  polylineConfig,
  showPinLocations = false
}, ref) => {
  const webViewRef = useRef<WebView>(null);

  // Update markers when markers prop changes
  React.useEffect(() => {
    if (webViewRef.current && markers && markers.length >= 0) {
      console.log('WebViewMap: Markers prop changed, updating WebView with:', markers);
      const message = {
        type: 'updateMarkers',
        markers: markers
      };
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  }, [markers]);

  useImperativeHandle(ref, () => ({
    fitToCoordinates: (coordinates, options = {}) => {
      const message = {
        type: 'fitToCoordinates',
        coordinates,
        options
      };
      webViewRef.current?.postMessage(JSON.stringify(message));
    },
    animateToRegion: (region) => {
      const message = {
        type: 'animateToRegion',
        region
      };
      webViewRef.current?.postMessage(JSON.stringify(message));
    },
    animateToCoordinate: (coordinate) => {
      const message = {
        type: 'animateToCoordinate',
        coordinate
      };
      webViewRef.current?.postMessage(JSON.stringify(message));
    },
    getCurrentLocation: () => {
      const message = {
        type: 'getCurrentLocation'
      };
      webViewRef.current?.postMessage(JSON.stringify(message));
    },
    startLiveTracking: () => {
      const message = {
        type: 'startLiveTracking'
      };
      webViewRef.current?.postMessage(JSON.stringify(message));
    },
    stopLiveTracking: () => {
      const message = {
        type: 'stopLiveTracking'
      };
      webViewRef.current?.postMessage(JSON.stringify(message));
    },
    updateMarkers: (markersData) => {
      const message = {
        type: 'updateMarkers',
        markers: markersData
      };
      webViewRef.current?.postMessage(JSON.stringify(message));
    }
  }));

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'regionChange':
          onRegionChange?.(data.region);
          break;
        case 'markerPress':
          if (data.marker.isPinLocation) {
            onPinLocationSelect?.(data.marker);
          } else {
            onMarkerPress?.(data.marker);
          }
          break;
        case 'currentLocationFound':
          // Handle current location found
          if (onRegionChange) {
            onRegionChange({
              latitude: data.location.latitude,
              longitude: data.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01
            });
          }
          break;
        case 'locationError':
          console.error('Location error:', data.error);
          break;
        case 'liveLocationUpdate':
          onLocationUpdate?.(data.location);
          break;
        case 'mapError':
          console.error('Map initialization error:', data.error);
          onError?.();
          break;
        case 'mapLoaded':
          onLoad?.();
          break;
        case 'destinationSelected':
          onPinLocationSelect?.(data.destination);
          break;
        case 'consoleLog':
          console.log('[WebView]', data.message);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <title>Google Maps</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: 100%; }
            #map { height: 100%; width: 100%; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <div id="loading" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: block;">
            <div style="text-align: center; color: #666;">
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007AFF; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                <div>Loading Map...</div>
            </div>
        </div>
        <div id="error" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: none; text-align: center; color: #ff3333;">
            <div>Failed to load map</div>
            <div style="font-size: 12px; margin-top: 5px;">Please check your internet connection</div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
        
        <script>
            let map;
            let markers = [];
            let directionsService;
            let directionsRenderer;
            let userLocationMarker;
            let polyline;
            let liveTrackingWatchId = null;
            
            // Override console.log to send logs to React Native
            const originalConsoleLog = console.log;
            const originalConsoleError = console.error;
            
            console.log = function(...args) {
                originalConsoleLog.apply(console, args);
                try {
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'consoleLog',
                        message: '[LOG] ' + args.join(' ')
                    }));
                } catch (e) {
                    // Ignore errors when sending logs
                }
            };
            
            console.error = function(...args) {
                originalConsoleError.apply(console, args);
                try {
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'consoleLog',
                        message: '[ERROR] ' + args.join(' ')
                    }));
                } catch (e) {
                    // Ignore errors when sending logs
                }
            };
            
            function showLoading() {
                document.getElementById('loading').style.display = 'block';
                document.getElementById('error').style.display = 'none';
            }
            
            function hideLoading() {
                document.getElementById('loading').style.display = 'none';
            }
            
            function showError() {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error').style.display = 'block';
            }
            
            function initMap() {
                try {
                    console.log('Initializing Google Maps...');
                    const initialRegion = ${JSON.stringify(initialRegion)};
                    console.log('Initial region:', initialRegion);
                    
                    const mapElement = document.getElementById('map');
                    if (!mapElement) {
                        console.error('Map element not found!');
                        showError();
                        return;
                    }
                    
                    if (!window.google || !window.google.maps) {
                        console.error('Google Maps API not loaded!');
                        showError();
                        return;
                    }
                    
                    // Validate initial region
                    if (!initialRegion.latitude || !initialRegion.longitude) {
                        console.error('Invalid initial region:', initialRegion);
                        showError();
                        return;
                    }
                    
                    map = new google.maps.Map(mapElement, {
                        center: { lat: initialRegion.latitude, lng: initialRegion.longitude },
                        zoom: 13,
                        styles: ${JSON.stringify(customMapStyle || [])},
                        disableDefaultUI: true,
                        gestureHandling: 'greedy',
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false
                    });
                    
                    // Wait for map to be fully loaded before proceeding
                    google.maps.event.addListenerOnce(map, 'idle', function() {
                        console.log('Map initialized and idle');
                        hideLoading();
                        
                        // Initialize other map components
                        initializeMapComponents();
                        
                        // Notify React Native that map is loaded
                        window.ReactNativeWebView?.postMessage(JSON.stringify({
                            type: 'mapLoaded'
                        }));
                    });
                    
                    // Fallback timeout in case 'idle' event doesn't fire
                    setTimeout(() => {
                        if (document.getElementById('loading').style.display !== 'none') {
                            console.log('Map load timeout, forcing completion');
                            hideLoading();
                            initializeMapComponents();
                            window.ReactNativeWebView?.postMessage(JSON.stringify({
                                type: 'mapLoaded'
                            }));
                        }
                    }, 5000);
                    
                } catch (error) {
                    console.error('Error initializing map:', error);
                    showError();
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'mapError',
                        error: error.message
                    }));
                }
            }
            
            function initializeMapComponents() {
                
                directionsService = new google.maps.DirectionsService();
                directionsRenderer = new google.maps.DirectionsRenderer({
                    suppressMarkers: true,
                    polylineOptions: {
                        strokeColor: '${directionsConfig?.strokeColor || '#007AFF'}',
                        strokeWeight: ${directionsConfig?.strokeWidth || 5}
                    }
                });
                directionsRenderer.setMap(map);
                
                // Show user location if enabled
                if (${showUserLocation}) {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((position) => {
                            const userLocation = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            };
                            
                            userLocationMarker = new google.maps.Marker({
                                position: userLocation,
                                map: map,
                                title: 'Your Location',
                                icon: {
                                    path: google.maps.SymbolPath.CIRCLE,
                                    scale: 8,
                                    fillColor: '#4285F4',
                                    fillOpacity: 1,
                                    strokeColor: '#ffffff',
                                    strokeWeight: 2
                                }
                            });
                            console.log('User location marker added');
                        });
                    }
                }
                
                // Start live tracking if enabled
                if (${enableLiveTracking}) {
                    startLiveTracking();
                }
                
                console.log('About to call updateMarkers, updateDirections, updatePolyline, addPinLocations');
                updateMarkers();
                updateDirections();
                updatePolyline();
                
                // Add pin locations if enabled
                if (${showPinLocations}) {
                    addPinLocations();
                }
                
                
                // Send map loaded message
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'mapLoaded'
                }));
                console.log('Map initialization complete');
            }
            
            let currentMarkersData = ${JSON.stringify(markers)};
            let pinLocationMarkers = [];
            
            // Predefined pin locations
            const pinLocations = [
                {
                    id: 'san-miguel-donnas',
                    name: "Donna's Restaurant & Special Pasalubong",
                    category: 'San Miguel',
                    latitude: 15.131632897010784,
                    longitude: 120.96200900157332,
                    address: "Donna's Restaurant & Special Pasalubong, San Miguel, Bulacan",
                    description: "Popular restaurant and pasalubong shop in San Miguel",
                    isPinLocation: true
                },
                {
                    id: 'san-miguel-redhorse',
                    name: "Red Horse Monument San Miguel Bulacan",
                    category: 'San Miguel',
                    latitude: 15.162589779129164,
                    longitude: 120.97136973659035,
                    address: "Red Horse Monument, San Miguel, Bulacan",
                    description: "Historic Red Horse Monument landmark",
                    isPinLocation: true
                },
                {
                    id: 'san-ildefonso-ministop',
                    name: "Old Ministop",
                    category: 'San Ildefonso',
                    latitude: 15.077388630676394,
                    longitude: 120.94174193757298,
                    address: "Old Ministop, San Ildefonso, Bulacan",
                    description: "Convenience store location in San Ildefonso",
                    isPinLocation: true
                },
                {
                    id: 'san-rafael-nesabel',
                    name: "NESABEL Drugstore",
                    category: 'San Rafael',
                    latitude: 15.027380609998,
                    longitude: 120.93456665582181,
                    address: "NESABEL Drugstore, San Rafael, Bulacan",
                    description: "Local drugstore in San Rafael",
                    isPinLocation: true
                }
            ];
            
            function addPinLocations() {
                console.log('Adding pin locations to map...');
                
                pinLocations.forEach((pinLocation) => {
                    const pinMarker = new google.maps.Marker({
                        position: { lat: pinLocation.latitude, lng: pinLocation.longitude },
                        map: map,
                        title: pinLocation.name,
                        icon: getPinLocationIcon(pinLocation.category)
                    });
                    
                    // Create info window for pin location
                    const infoWindow = new google.maps.InfoWindow({
                        content: createPinInfoWindowContent(pinLocation)
                    });
                    
                    pinMarker.addListener('click', () => {
                        console.log('Pin location clicked:', pinLocation);
                        
                        // Close other info windows
                        pinLocationMarkers.forEach(marker => {
                            if (marker.infoWindow) {
                                marker.infoWindow.close();
                            }
                        });
                        
                        // Open this info window
                        infoWindow.open(map, pinMarker);
                        
                        // Send pin location selection to React Native
                        window.ReactNativeWebView?.postMessage(JSON.stringify({
                            type: 'markerPress',
                            marker: pinLocation
                        }));
                    });
                    
                    pinMarker.infoWindow = infoWindow;
                    pinLocationMarkers.push(pinMarker);
                });
                
                console.log('Added', pinLocationMarkers.length, 'pin location markers');
            }
            
            function createPinInfoWindowContent(pinLocation) {
                return \`
                    <div style="max-width: 250px; font-family: Arial, sans-serif;">
                        <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">\${pinLocation.name}</h3>
                        <p style="margin: 0 0 8px 0; color: #666; font-size: 12px; font-weight: bold;">\${pinLocation.category}</p>
                        <p style="margin: 0 0 12px 0; color: #555; font-size: 13px;">\${pinLocation.description}</p>
                        <button 
                            onclick="selectDestination('\${pinLocation.id}')" 
                            style="
                                background: #007AFF; 
                                color: white; 
                                border: none; 
                                padding: 8px 16px; 
                                border-radius: 6px; 
                                cursor: pointer;
                                font-size: 12px;
                                font-weight: bold;
                            "
                        >
                            Select as Destination
                        </button>
                    </div>
                \`;
            }
            
            function selectDestination(pinLocationId) {
                const pinLocation = pinLocations.find(p => p.id === pinLocationId);
                if (pinLocation) {
                    console.log('Destination selected:', pinLocation);
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'destinationSelected',
                        destination: pinLocation
                    }));
                }
            }
            
            function getPinLocationIcon(category) {
                const categoryColors = {
                    'San Miguel': '#FF6B35',
                    'San Ildefonso': '#007AFF', 
                    'San Rafael': '#34C759'
                };
                
                const color = categoryColors[category] || '#FF6B35';
                
                // Create custom pin marker SVG
                const svgMarker = \`<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 0 C24 0, 30 6, 30 14 C30 20, 16 38, 16 38 S2 20, 2 14 C2 6, 8 0, 16 0 Z" 
                          fill="\${color}" stroke="#ffffff" stroke-width="2"/>
                    <circle cx="16" cy="14" r="8" fill="white"/>
                    <text x="16" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="\${color}">📍</text>
                </svg>\`;
                
                return {
                    url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarker),
                    scaledSize: new google.maps.Size(32, 40),
                    anchor: new google.maps.Point(16, 38)
                };
            }
            
            function updateMarkers() {
                updateMarkersWithData(currentMarkersData);
            }
            
            function updateMarkersWithData(markersData) {
                try {
                    console.log('=== MARKER UPDATE START ===');
                    console.log('Map object exists:', !!map);
                    console.log('Google Maps loaded:', !!window.google?.maps);
                    
                    // Clear existing markers
                    markers.forEach(marker => {
                        if (marker && marker.setMap) {
                            marker.setMap(null);
                        }
                    });
                    
                    markersData.forEach((markerData, index) => {
                        try {
                            console.log('Processing marker', index, ':', markerData);
                            
                            if (!markerData.latitude || !markerData.longitude) {
                                console.error('Invalid marker coordinates:', markerData);
                                return;
                            }
                            
                            // Use vehicleType if available, otherwise fall back to type
                            const vehicleType = markerData.vehicleType || markerData.type || 'Tricycle';
                            console.log('Using vehicle type:', vehicleType);
                            
                            const icon = getMarkerIcon(vehicleType);
                            console.log('Generated icon:', icon);
                            
                            const marker = new google.maps.Marker({
                                position: { lat: parseFloat(markerData.latitude), lng: parseFloat(markerData.longitude) },
                                map: map,
                                title: markerData.title || 'Rider',
                                icon: icon
                            });
                            
                            console.log('Created rider marker at:', markerData.latitude, markerData.longitude);
                            
                            marker.addListener('click', () => {
                                console.log('Marker clicked:', markerData);
                                window.ReactNativeWebView?.postMessage(JSON.stringify({
                                    type: 'markerPress',
                                    marker: markerData
                                }));
                            });
                            
                            markers.push(marker);
                            console.log('Total markers on map:', markers.length);
                        } catch (markerError) {
                            console.error('Error creating individual marker:', markerError, markerData);
                        }
                    });
                    
                    console.log('=== MARKER UPDATE COMPLETE ===');
                    console.log('Final marker count:', markers.length);
                } catch (error) {
                    console.error('Error in updateMarkersWithData:', error);
                }
            }
            
            function getMarkerIcon(vehicleType) {
                // Map vehicle types to colors and create custom SVG markers with better icons
                const vehicleTypeMap = {
                    'Single Motorcycle': {
                        color: '#FF6B35',
                        bgColor: '#FFF3F0',
                        icon: '🏍',
                        symbol: '🏍'
                    },
                    'Tricycle': {
                        color: '#FFB000',
                        bgColor: '#FFF8E1',
                        icon: '🛖',
                        symbol: '🛖'
                    },
                    'Cab': {
                        color: '#007AFF',
                        bgColor: '#E3F2FD',
                        icon: '🚗',
                        symbol: '🚗'
                    },
                    // Fallback for legacy types
                    'bike': {
                        color: '#FF6B35',
                        bgColor: '#FFF3F0',
                        icon: '🏍',
                        symbol: '🏍'
                    },
                    'auto': {
                        color: '#FFB000',
                        bgColor: '#FFF8E1',
                        icon: '🛺',
                        symbol: '🛺'
                    },
                    'cab': {
                        color: '#007AFF',
                        bgColor: '#E3F2FD',
                        icon: '🚗',
                        symbol: '🚗'
                    }
                };
                
                const config = vehicleTypeMap[vehicleType] || vehicleTypeMap['auto'];
                console.log('Creating marker icon for vehicle type:', vehicleType, 'with config:', config);
                
                // Create modern, professional marker design
                const svgMarker = '<svg width="44" height="54" viewBox="0 0 44 54" xmlns="http://www.w3.org/2000/svg">' +
                    // Drop shadow
                    '<ellipse cx="22" cy="48" rx="10" ry="4" fill="rgba(0,0,0,0.2)"/>' +
                    // Outer glow
                    '<circle cx="22" cy="22" r="20" fill="' + config.color + '" opacity="0.1"/>' +
                    // Main marker body with gradient effect
                    '<path d="M22 6 C30 6, 36 12, 36 20 C36 26, 22 42, 22 42 S8 26, 8 20 C8 12, 14 6, 22 6 Z" ' +
                    'fill="' + config.color + '" stroke="#ffffff" stroke-width="3" filter="url(#shadow)"/>' +
                    // Inner circle with subtle gradient
                    '<circle cx="22" cy="20" r="12" fill="' + config.bgColor + '" stroke="' + config.color + '" stroke-width="1.5"/>' +
                    // Vehicle symbol using Unicode
                    '<text x="22" y="26" text-anchor="middle" font-size="16" font-weight="bold" fill="' + config.color + '">' + config.symbol + '</text>' +
                    // Add subtle inner highlight
                    '<circle cx="22" cy="20" r="12" fill="url(#highlight)" opacity="0.3"/>' +
                    // Define gradients and filters
                    '<defs>' +
                    '<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">' +
                    '<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>' +
                    '</filter>' +
                    '<radialGradient id="highlight" cx="30%" cy="30%">' +
                    '<stop offset="0%" stop-color="white" stop-opacity="0.8"/>' +
                    '<stop offset="100%" stop-color="white" stop-opacity="0"/>' +
                    '</radialGradient>' +
                    '</defs>' +
                    '</svg>';
                
                return {
                    url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarker),
                    scaledSize: new google.maps.Size(44, 54),
                    anchor: new google.maps.Point(22, 42)
                };
            }
            
            function updateDirections() {
                if (${showDirections} && ${JSON.stringify(directionsConfig)}) {
                    const config = ${JSON.stringify(directionsConfig)};
                    if (config && config.origin && config.destination) {
                        directionsService.route({
                            origin: config.origin,
                            destination: config.destination,
                            travelMode: google.maps.TravelMode.DRIVING
                        }, (result, status) => {
                            if (status === 'OK') {
                                directionsRenderer.setDirections(result);
                            }
                        });
                    }
                }
            }
            
            function updatePolyline() {
                if (polyline) {
                    polyline.setMap(null);
                }
                
                if (${showPolyline}) {
                    const coordinates = ${JSON.stringify(polylineCoordinates)};
                    const config = ${JSON.stringify(polylineConfig || {})};
                    
                    if (coordinates.length > 0) {
                        polyline = new google.maps.Polyline({
                            path: coordinates.map(coord => ({ lat: coord.latitude, lng: coord.longitude })),
                            geodesic: true,
                            strokeColor: config.strokeColor || '#FF0000',
                            strokeOpacity: 1.0,
                            strokeWeight: config.strokeWidth || 2
                        });
                        
                        polyline.setMap(map);
                    }
                }
            }
            
            // Listen for messages from React Native
            window.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case 'fitToCoordinates':
                        if (data.coordinates.length > 0) {
                            const bounds = new google.maps.LatLngBounds();
                            data.coordinates.forEach(coord => {
                                bounds.extend(new google.maps.LatLng(coord.latitude, coord.longitude));
                            });
                            map.fitBounds(bounds);
                            
                            // Add padding for better visibility
                            if (data.options && data.options.edgePadding) {
                                map.panBy(0, 0); // Trigger a small pan to apply bounds
                            }
                        }
                        break;
                    case 'animateToRegion':
                        const center = { lat: data.region.latitude, lng: data.region.longitude };
                        map.setCenter(center);
                        if (data.region.zoom) {
                            map.setZoom(data.region.zoom);
                        } else {
                            // Calculate zoom based on latitudeDelta
                            const zoom = Math.round(Math.log(360 / data.region.latitudeDelta) / Math.LN2);
                            map.setZoom(Math.min(Math.max(zoom, 10), 18));
                        }
                        break;
                    case 'getCurrentLocation':
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((position) => {
                                const userLocation = {
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude
                                };
                                
                                map.setCenter(userLocation);
                                map.setZoom(16);
                                
                                // Update user location marker
                                if (userLocationMarker) {
                                    userLocationMarker.setPosition(userLocation);
                                } else {
                                    userLocationMarker = new google.maps.Marker({
                                        position: userLocation,
                                        map: map,
                                        icon: {
                                            path: google.maps.SymbolPath.CIRCLE,
                                            scale: 8,
                                            fillColor: '#4285F4',
                                            fillOpacity: 1,
                                            strokeColor: '#ffffff',
                                            strokeWeight: 2
                                        }
                                    });
                                }
                                
                                // Send location back to React Native
                                window.ReactNativeWebView?.postMessage(JSON.stringify({
                                    type: 'currentLocationFound',
                                    location: {
                                        latitude: position.coords.latitude,
                                        longitude: position.coords.longitude
                                    }
                                }));
                            }, (error) => {
                                window.ReactNativeWebView?.postMessage(JSON.stringify({
                                    type: 'locationError',
                                    error: error.message
                                }));
                            });
                        }
                        break;
                    case 'animateToCoordinate':
                        const coord = { lat: data.coordinate.latitude, lng: data.coordinate.longitude };
                        map.panTo(coord);
                        break;
                    case 'startLiveTracking':
                        startLiveTracking();
                        break;
                    case 'stopLiveTracking':
                        stopLiveTracking();
                        break;
                    case 'updateMarkers':
                        console.log('Received updateMarkers message with data:', data.markers);
                        currentMarkersData = data.markers;
                        updateMarkersWithData(data.markers);
                        break;
                }
            });
            
            function startLiveTracking() {
                if (navigator.geolocation && !liveTrackingWatchId) {
                    liveTrackingWatchId = navigator.geolocation.watchPosition(
                        (position) => {
                            const userLocation = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            };
                            
                            // Update user location marker
                            if (userLocationMarker) {
                                userLocationMarker.setPosition(userLocation);
                            } else {
                                userLocationMarker = new google.maps.Marker({
                                    position: userLocation,
                                    map: map,
                                    icon: {
                                        path: google.maps.SymbolPath.CIRCLE,
                                        scale: 8,
                                        fillColor: '#4285F4',
                                        fillOpacity: 1,
                                        strokeColor: '#ffffff',
                                        strokeWeight: 2
                                    }
                                });
                            }
                            
                            // Send location update to React Native
                            window.ReactNativeWebView?.postMessage(JSON.stringify({
                                type: 'liveLocationUpdate',
                                location: {
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude
                                }
                            }));
                        },
                        (error) => {
                            console.error('Live tracking error:', error);
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 5000
                        }
                    );
                }
            }
            
            function stopLiveTracking() {
                if (liveTrackingWatchId) {
                    navigator.geolocation.clearWatch(liveTrackingWatchId);
                    liveTrackingWatchId = null;
                }
            }
        </script>
        <script>
            // Show loading initially
            document.addEventListener('DOMContentLoaded', function() {
                showLoading();
            });
            
            // Handle Google Maps API load failure
            window.gm_authFailure = function() {
                console.error('Google Maps API authentication failed');
                showError();
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'mapError',
                    error: 'Google Maps API authentication failed'
                }));
            };
            
            // Extended timeout with retry mechanism
            let retryCount = 0;
            const maxRetries = 3;
            
            function checkMapLoad() {
                if (window.google && window.google.maps) {
                    if (!map) {
                        initMap();
                    }
                    return;
                }
                
                retryCount++;
                if (retryCount < maxRetries) {
                    console.log('Retrying Google Maps load (' + retryCount + '/' + maxRetries + ')...');
                    setTimeout(checkMapLoad, 3000);
                } else {
                    console.error('Google Maps API failed to load after retries');
                    showError();
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'mapError',
                        error: 'Failed to load Google Maps API after multiple retries'
                    }));
                }
            }
            
            setTimeout(checkMapLoad, 5000);
        </script>
        <script>
            // Improved Google Maps loading with error handling
            function loadGoogleMaps() {
                const script = document.createElement('script');
                script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAO0FLe4ZAqH36QIrkbhsb2qpHdS-tZVlc&libraries=geometry';
                script.async = true;
                script.defer = true;
                
                script.onload = function() {
                    console.log('Google Maps script loaded successfully');
                    if (window.google && window.google.maps) {
                        initMap();
                    } else {
                        setTimeout(() => {
                            if (window.google && window.google.maps) {
                                initMap();
                            }
                        }, 1000);
                    }
                };
                
                script.onerror = function() {
                    console.error('Failed to load Google Maps script');
                    showError();
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'mapError',
                        error: 'Failed to load Google Maps script'
                    }));
                };
                
                document.head.appendChild(script);
            }
            
            // Load maps when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', loadGoogleMaps);
            } else {
                loadGoogleMaps();
            }
        </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={false}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error: ', nativeEvent);
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewMap;
