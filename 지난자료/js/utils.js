export function isRecent(updateDate) {
    if (!updateDate) return false;
    const days = (new Date() - new Date(updateDate)) / (1000 * 60 * 60 * 24);
    return days < 60;
}

export function getLatLng(item, country, constants) {
    if (item.lat && item.lng && !isNaN(item.lat) && !isNaN(item.lng)) {
        return [parseFloat(item.lat), parseFloat(item.lng)];
    }
    if (constants.CITY_LATLNGS && item.city && constants.CITY_LATLNGS[item.city]) {
        return constants.CITY_LATLNGS[item.city];
    }
    return constants.LATLNGS[country] || [20, 0];
} 