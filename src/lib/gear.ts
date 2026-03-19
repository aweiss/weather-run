export function getGearSuggestion(feelslike: number): string {
  if (feelslike >= 75) {
    return "Singlet, split shorts, sunglasses. Stay hydrated.";
  }
  if (feelslike >= 60) {
    return "T-shirt and shorts. Light and fast.";
  }
  if (feelslike >= 45) {
    return "Long sleeve, shorts or tights. Arm sleeves optional.";
  }
  if (feelslike >= 30) {
    return "Base layer, tights, gloves, headband.";
  }
  if (feelslike >= 15) {
    return "Insulated jacket, tights, gloves, hat, buff.";
  }
  return "Full winter kit. Double-layer gloves, balaclava, insulated tights.";
}
