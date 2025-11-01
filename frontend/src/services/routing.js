// OpenRouteService - Best global coverage, free tier with 2000 requests/day
// Sign up at https://openrouteservice.org for a free API key
// For now, we'll try without key first (limited requests)
async function getRouteOpenRouteService(point1, point2) {
  const [lon1, lat1] = [point1.longitude, point1.latitude];
  const [lon2, lat2] = [point2.longitude, point2.latitude];
  
  // OpenRouteService Directions API - excellent global coverage including Ethiopia
  // Try without API key first (very limited), but works for basic routing
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248a11b89b05ea64a37b20d69e72a5c4b1a&start=${lon1},${lat1}&end=${lon2},${lat2}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenRouteService failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const geometry = feature.geometry?.coordinates || [];
      
      if (!geometry || geometry.length === 0) {
        throw new Error('No geometry in OpenRouteService response');
      }
      
      // Convert from [lon, lat] to [lat, lon] for Leaflet
      const points = geometry.map(coord => [coord[1], coord[0]]);
      
      const properties = feature.properties || {};
      const summary = properties.summary || {};
      
      return {
        points,
        distance: summary.distance || null, // in meters
        duration: summary.duration || null, // in seconds
      };
    }
    
    throw new Error('No route found in OpenRouteService response');
  } catch (error) {
    // If API key doesn't work, throw to try next service
    throw error;
  }
}

// OSRM primary routing service (free, no API key, good global coverage)
async function getRouteOSRM(point1, point2) {
  const [lon1, lat1] = [point1.longitude, point1.latitude];
  const [lon2, lat2] = [point2.longitude, point2.latitude];
  
  // Use overview=full to get detailed route geometry (not just simplified)
  const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson&steps=false`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'OpsPulse/1.0'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OSRM routing failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
    const route = data.routes[0];
    const geometry = route.geometry?.coordinates || route.geometry;
    
    if (!geometry || geometry.length === 0) {
      throw new Error('No geometry in OSRM response');
    }
    
    // Convert from [lon, lat] to [lat, lon] for Leaflet
    const points = geometry.map(coord => [coord[1], coord[0]]);
    
    if (points.length < 2) {
      throw new Error('Route has insufficient points');
    }
    
    return {
      points,
      distance: route.distance, // in meters
      duration: route.duration, // in seconds
    };
  }
  
  if (data.code === 'NoRoute') {
    throw new Error('OSRM: No route found between points');
  }
  
  throw new Error(`OSRM error: ${data.code || 'Unknown error'}`);
}

export async function getRoute(point1, point2) {
  // Try OpenRouteService first (best global coverage including Ethiopia)
  try {
    const route = await getRouteOpenRouteService(point1, point2);
    if (route.points && route.points.length > 2) {
      console.log(`✅ Got OpenRouteService route with ${route.points.length} points`);
      return route;
    }
  } catch (error) {
    console.log('⚠️ OpenRouteService failed, trying OSRM:', error.message);
  }
  
  // Fallback to OSRM
  try {
    const route = await getRouteOSRM(point1, point2);
    if (route.points && route.points.length > 2) {
      console.log(`✅ Got OSRM route with ${route.points.length} points`);
      return route;
    }
  } catch (error) {
    console.log('⚠️ OSRM also failed:', error.message);
  }
  
  // Final fallback: straight line (but add more intermediate points for smoother appearance)
  const lat1 = point1.latitude;
  const lon1 = point1.longitude;
  const lat2 = point2.latitude;
  const lon2 = point2.longitude;
  
  // Create intermediate points for a smoother straight line
  const numPoints = Math.max(5, Math.floor(Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)) * 100));
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints;
    points.push([
      lat1 + (lat2 - lat1) * ratio,
      lon1 + (lon2 - lon1) * ratio
    ]);
  }
  
  return {
    points,
    distance: null,
    duration: null,
  };
}

