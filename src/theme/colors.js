const light = {
  bg:'#F3F6FA',
  surface:'#FFFFFF',
  surface2:'#EAF0F7',
  navy:'#0A2241',
  blue:'#1769D2',
  cyan:'#20B9D8',
  teal:'#087F82',
  green:'#16875B',
  text:'#162A43',
  muted:'#708198',
  line:'#DCE5EF',
  red:'#C83E50',
  white:'#FFFFFF',
};

const dark = {
  bg:'#091321',
  surface:'#111F30',
  surface2:'#1A2A3E',
  navy:'#07182D',
  blue:'#68A8FF',
  cyan:'#4BD7EA',
  teal:'#46C5C0',
  green:'#50D09A',
  text:'#EDF4FC',
  muted:'#A5B5C9',
  line:'#2B3D54',
  red:'#FF7F8B',
  white:'#FFFFFF',
};

// Keep a stable object reference because screens and shared components import it directly.
export const colors = { ...light };

export function setColorScheme(scheme) {
  const palette = scheme === 'dark' ? dark : light;
  Object.assign(colors, palette);
}
